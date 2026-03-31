import { supabase } from '@/shared/hooks/useSupabase';
import type { TogglExclusion } from '../types';

export async function fetchExclusions(): Promise<TogglExclusion[]> {
  const { data, error } = await supabase
    .from('toggl_exclusions')
    .select('*')
    .order('excluded_at', { ascending: false });

  if (error) throw error;
  return data as TogglExclusion[];
}

export async function fetchExcludedEntryIds(): Promise<Set<number>> {
  const exclusions = await fetchExclusions();
  return new Set(exclusions.map((e) => e.toggl_entry_id));
}

export async function createExclusion(togglEntryId: number): Promise<TogglExclusion> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('toggl_exclusions')
    .insert({
      toggl_entry_id: togglEntryId,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TogglExclusion;
}

export async function removeExclusion(id: string): Promise<void> {
  const { error } = await supabase
    .from('toggl_exclusions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
