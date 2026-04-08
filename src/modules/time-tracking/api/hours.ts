import { supabase } from '@/shared/hooks/useSupabase';

/**
 * Fetch total actual hours per project across all projects.
 * Combines Toggl cached entries + manual time entries.
 * Returns a map of project_id → total hours.
 */
export async function fetchHoursByProject(): Promise<ReadonlyMap<string, number>> {
  const [togglResult, manualResult] = await Promise.all([
    supabase
      .from('toggl_cached_entries')
      .select('project_id, duration_hours')
      .not('project_id', 'is', null),
    supabase
      .from('manual_time_entries')
      .select('project_id, hours'),
  ]);

  const map = new Map<string, number>();

  for (const entry of togglResult.data ?? []) {
    const row = entry as { project_id: string; duration_hours: number };
    const current = map.get(row.project_id) ?? 0;
    map.set(row.project_id, current + row.duration_hours);
  }

  for (const entry of manualResult.data ?? []) {
    const row = entry as { project_id: string; hours: number };
    const current = map.get(row.project_id) ?? 0;
    map.set(row.project_id, current + row.hours);
  }

  return map;
}
