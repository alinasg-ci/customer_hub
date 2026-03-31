/**
 * Time tracking adapter — interface layer.
 * M1: calls Toggl API via server-side routes.
 * M7: will switch to native storage. No other module changes needed.
 */

import { supabase } from '@/shared/hooks/useSupabase';
import {
  fetchTogglConnection,
  fetchCachedEntries,
  fetchTogglMappings,
  updateLastSyncAt,
} from './api/toggl';
import type { TogglTimeEntry, TimeEntry } from './types';

/**
 * Get all time entries for a project — both Toggl and manual.
 * This is the single source of truth for time data.
 */
export async function getTimeEntries(projectId: string): Promise<TimeEntry[]> {
  const [cached, manualResult] = await Promise.all([
    fetchCachedEntries(projectId),
    supabase
      .from('manual_time_entries')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false }),
  ]);

  const togglEntries: TimeEntry[] = cached.map((entry) => ({
    id: entry.id,
    source: 'toggl' as const,
    projectId: entry.project_id,
    phaseId: entry.phase_id,
    description: entry.description,
    date: entry.start_time.split('T')[0],
    durationHours: entry.duration_hours,
    billable: entry.billable,
    assignmentType: entry.phase_assignment_type,
  }));

  const manualEntries: TimeEntry[] = (manualResult.data ?? []).map((entry: {
    id: string;
    project_id: string;
    phase_id: string | null;
    date: string;
    hours: number;
    description: string | null;
    billable: boolean;
  }) => ({
    id: entry.id,
    source: 'manual' as const,
    projectId: entry.project_id,
    phaseId: entry.phase_id,
    description: entry.description,
    date: entry.date,
    durationHours: entry.hours,
    billable: entry.billable,
    assignmentType: 'manual' as const,
  }));

  return [...togglEntries, ...manualEntries];
}

async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return `Bearer ${session.access_token}`;
}

export async function syncTime(): Promise<{ synced: number; total: number }> {
  const connection = await fetchTogglConnection();
  if (!connection) throw new Error('No Toggl connection found');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Calculate sync window
  const lastSync = connection.last_sync_at
    ? new Date(new Date(connection.last_sync_at).getTime() - 24 * 60 * 60 * 1000).toISOString()
    : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch from Toggl via server-side route (token stays server-side)
  const authHeader = await getAuthHeader();
  const response = await fetch('/api/toggl/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify({
      connectionId: connection.id,
      startDate: lastSync,
    }),
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error.message);

  const togglEntries: TogglTimeEntry[] = result.data;

  // Get mappings to resolve toggl_project_id → hub project_id
  const mappings = await fetchTogglMappings();
  const mappingLookup = new Map(mappings.map((m) => [m.toggl_project_id, m.project_id]));

  // Bulk upsert — build rows, then batch insert/update
  const newRows: Record<string, unknown>[] = [];
  const existingIds = new Set<number>();

  // Fetch all existing toggl_entry_ids in one query
  const entryIds = togglEntries.map((e) => e.id);
  const { data: existingEntries } = await supabase
    .from('toggl_cached_entries')
    .select('id, toggl_entry_id, phase_id, phase_assignment_type')
    .in('toggl_entry_id', entryIds);

  const existingMap = new Map(
    (existingEntries ?? []).map((e: { id: string; toggl_entry_id: number; phase_id: string | null; phase_assignment_type: string }) =>
      [e.toggl_entry_id, e]
    )
  );

  for (const entry of togglEntries) {
    const projectId = entry.project_id ? mappingLookup.get(entry.project_id) ?? null : null;
    const existing = existingMap.get(entry.id);

    const row = {
      toggl_entry_id: entry.id,
      toggl_project_id: entry.project_id,
      project_id: projectId,
      description: entry.description ?? '',
      start_time: entry.start,
      stop_time: entry.stop,
      duration_seconds: entry.duration,
      duration_hours: Math.round((entry.duration / 3600) * 100) / 100,
      billable: entry.billable,
      tags: entry.tags,
      fetched_at: new Date().toISOString(),
      user_id: user.id,
    };

    if (existing) {
      existingIds.add(entry.id);
      // Batch update — preserve manual phase assignments
      await supabase
        .from('toggl_cached_entries')
        .update({
          ...row,
          phase_id: existing.phase_id,
          phase_assignment_type: existing.phase_assignment_type,
        })
        .eq('id', existing.id);
    } else {
      newRows.push({
        ...row,
        phase_assignment_type: 'unassigned',
      });
    }
  }

  // Bulk insert new entries
  if (newRows.length > 0) {
    const { error } = await supabase
      .from('toggl_cached_entries')
      .insert(newRows);
    if (error) throw error;
  }

  // Update last sync timestamp
  await updateLastSyncAt(connection.id);

  return { synced: newRows.length, total: togglEntries.length };
}
