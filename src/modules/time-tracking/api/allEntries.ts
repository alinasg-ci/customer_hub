import { supabase } from '@/shared/hooks/useSupabase';

export type RawManualEntry = {
  readonly id: string;
  readonly project_id: string | null;
  readonly phase_id: string | null;
  readonly task_id: string | null;
  readonly date: string;
  readonly hours: number;
  readonly description: string | null;
  readonly billable: boolean;
  readonly start_time: string | null;
  readonly end_time: string | null;
  readonly user_id: string;
};

export async function fetchAllManualEntries(): Promise<RawManualEntry[]> {
  const { data, error } = await supabase
    .from('manual_time_entries')
    .select('id, project_id, phase_id, task_id, date, hours, description, billable, start_time, end_time, user_id')
    .order('date', { ascending: false });

  if (error) throw error;
  return data as RawManualEntry[];
}
