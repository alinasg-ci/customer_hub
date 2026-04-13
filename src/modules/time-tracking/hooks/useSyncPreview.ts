'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/hooks/useSupabase';
import { fetchTogglConnection, fetchTogglMappings } from '../api/toggl';
import { fetchExcludedEntryIds, createExclusion } from '../api/exclusions';
import type { SyncPreviewEntry, TogglTimeEntry } from '../types';

export function useSyncPreview() {
  const [previewEntries, setPreviewEntries] = useState<SyncPreviewEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(false);

  useEffect(() => {
    try {
      setAutoSync(localStorage.getItem('toggl_auto_sync') === 'true');
    } catch {
      // localStorage unavailable
    }
  }, []);

  const toggleAutoSync = useCallback((enabled: boolean) => {
    setAutoSync(enabled);
    try {
      localStorage.setItem('toggl_auto_sync', String(enabled));
    } catch {
      // localStorage unavailable
    }
  }, []);

  const startPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const connection = await fetchTogglConnection();
      if (!connection) throw new Error('No Toggl connection found');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      // Token is verified server-side via authenticateRequest()/getUser()

      // Calculate sync window
      const OVERLAP_MS = 24 * 60 * 60 * 1000;
      const SYNC_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;
      const lastSync = connection.last_sync_at
        ? new Date(new Date(connection.last_sync_at).getTime() - OVERLAP_MS).toISOString()
        : new Date(Date.now() - SYNC_WINDOW_MS).toISOString();

      // Fetch from Toggl
      const response = await fetch('/api/toggl/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          connectionId: connection.id,
          startDate: lastSync,
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error.message);

      const togglEntries: TogglTimeEntry[] = result.data;

      // Get excluded entries and mappings
      const [excludedIds, mappings] = await Promise.all([
        fetchExcludedEntryIds(),
        fetchTogglMappings(),
      ]);

      const mappingLookup = new Map(mappings.map((m) => [m.toggl_project_id, { projectId: m.project_id, projectName: m.toggl_project_name }]));

      // Filter out excluded and build preview
      const preview: SyncPreviewEntry[] = togglEntries
        .filter((e) => !excludedIds.has(e.id))
        .map((entry) => {
          const mapping = entry.project_id ? mappingLookup.get(entry.project_id) : undefined;
          return {
            toggl_entry_id: entry.id,
            description: entry.description,
            start_time: entry.start,
            duration_hours: Math.round((entry.duration / 3600) * 100) / 100,
            billable: entry.billable,
            toggl_project_name: mapping?.projectName ?? null,
            proposed_project_id: mapping?.projectId ?? null,
            proposed_phase_id: null,
            proposed_phase_name: null,
            action: 'accept' as const,
            reassigned_phase_id: null,
          };
        });

      setPreviewEntries(preview);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load sync preview';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const setEntryAction = useCallback((togglEntryId: number, action: 'accept' | 'reassign' | 'exclude', phaseId?: string) => {
    setPreviewEntries((prev) =>
      prev.map((e) =>
        e.toggl_entry_id === togglEntryId
          ? { ...e, action, reassigned_phase_id: phaseId ?? null }
          : e
      )
    );
  }, []);

  const acceptAll = useCallback(() => {
    setPreviewEntries((prev) =>
      prev.map((e) => ({ ...e, action: 'accept' as const }))
    );
  }, []);

  const confirmSync = useCallback(async () => {
    setConfirming(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const connection = await fetchTogglConnection();
      if (!connection) throw new Error('No Toggl connection found');

      const mappings = await fetchTogglMappings();
      const mappingLookup = new Map(mappings.map((m) => [m.toggl_project_id, m.project_id]));

      // Batch operations instead of sequential awaits
      const exclusionIds: number[] = [];
      const upsertRows: Record<string, unknown>[] = [];

      for (const entry of previewEntries) {
        if (entry.action === 'exclude') {
          exclusionIds.push(entry.toggl_entry_id);
          continue;
        }

        if (entry.action === 'accept' || entry.action === 'reassign') {
          const phaseId = entry.action === 'reassign' ? entry.reassigned_phase_id : entry.proposed_phase_id;
          upsertRows.push({
            toggl_entry_id: entry.toggl_entry_id,
            toggl_project_id: null,
            project_id: entry.proposed_project_id,
            phase_id: phaseId,
            phase_assignment_type: phaseId ? 'manual' : 'unassigned',
            description: entry.description ?? '',
            start_time: entry.start_time,
            stop_time: null,
            duration_seconds: Math.round(entry.duration_hours * 3600),
            duration_hours: entry.duration_hours,
            billable: entry.billable,
            tags: [],
            fetched_at: new Date().toISOString(),
            sync_status: 'accepted',
            user_id: user.id,
          });
        }
      }

      // Execute batched operations in parallel
      const operations: Promise<unknown>[] = [];

      if (exclusionIds.length > 0) {
        for (const id of exclusionIds) {
          operations.push(createExclusion(id));
        }
      }

      if (upsertRows.length > 0) {
        operations.push(
          (async () => {
            const { error: upsertError } = await supabase
              .from('toggl_cached_entries')
              .upsert(upsertRows, { onConflict: 'toggl_entry_id' });
            if (upsertError) throw upsertError;
          })()
        );
      }

      await Promise.all(operations);

      // Update last sync timestamp
      await supabase
        .from('toggl_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', connection.id);

      setPreviewEntries([]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sync confirmation failed';
      setError(message);
    } finally {
      setConfirming(false);
    }
  }, [previewEntries]);

  return {
    previewEntries,
    loading,
    confirming,
    error,
    autoSync,
    toggleAutoSync,
    startPreview,
    setEntryAction,
    acceptAll,
    confirmSync,
  };
}
