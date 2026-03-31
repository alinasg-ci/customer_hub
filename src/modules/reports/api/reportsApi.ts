import { supabase } from '@/shared/hooks/useSupabase';
import type { ManualTimeEntry, CreateManualEntryInput } from '../types';

export async function fetchManualEntries(projectId: string): Promise<ManualTimeEntry[]> {
  const { data, error } = await supabase
    .from('manual_time_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data as ManualTimeEntry[];
}

export async function createManualEntry(input: CreateManualEntryInput): Promise<ManualTimeEntry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('manual_time_entries')
    .insert({
      project_id: input.project_id,
      phase_id: input.phase_id ?? null,
      sub_project_id: null,
      date: input.date,
      hours: input.hours,
      description: input.description ?? null,
      billable: input.billable ?? true,
      note: input.note ?? null,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ManualTimeEntry;
}

export async function deleteManualEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('manual_time_entries')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
