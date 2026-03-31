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
import type { CachedTimeEntry, TogglTimeEntry, TimeEntry } from './types';

export async function getTimeEntries(projectId: string): Promise<TimeEntry[]> {
  const cached = await fetchCachedEntries(projectId);

  return cached.map((entry) => ({
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
}

export async function syncTime(): Promise<{ synced: number; total: number }> {
  const connection = await fetchTogglConnection();
  if (!connection) throw new Error('No Toggl connection found');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Calculate sync window
  const lastSync = connection.last_sync_at
    ? new Date(new Date(connection.last_sync_at).getTime() - 24 * 60 * 60 * 1000).toISOString() // 1 day overlap
    : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 3 months for initial

  // Fetch from Toggl via server-side route
  const response = await fetch('/api/toggl/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiToken: connection.api_token_encrypted,
      startDate: lastSync,
    }),
  });

  const result = await response.json();
  if (result.error) throw new Error(result.error.message);

  const togglEntries: TogglTimeEntry[] = result.data;

  // Get mappings to resolve toggl_project_id → hub project_id
  const mappings = await fetchTogglMappings();
  const mappingLookup = new Map(mappings.map((m) => [m.toggl_project_id, m.project_id]));

  // Upsert entries
  let synced = 0;
  for (const entry of togglEntries) {
    const projectId = entry.project_id ? mappingLookup.get(entry.project_id) ?? null : null;

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

    // Upsert by toggl_entry_id
    const { data: existing } = await supabase
      .from('toggl_cached_entries')
      .select('id, phase_id, phase_assignment_type')
      .eq('toggl_entry_id', entry.id)
      .maybeSingle();

    if (existing) {
      // Update but preserve manual phase assignments
      await supabase
        .from('toggl_cached_entries')
        .update({
          ...row,
          phase_id: existing.phase_id, // Keep existing phase assignment
          phase_assignment_type: existing.phase_assignment_type,
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('toggl_cached_entries')
        .insert({
          ...row,
          phase_assignment_type: 'unassigned',
        });
      synced++;
    }
  }

  // Update last sync timestamp
  await updateLastSyncAt(connection.id);

  return { synced, total: togglEntries.length };
}
