import { supabase } from '@/shared/hooks/useSupabase';
import type { PlanningRow, CreatePlanningRowInput, UpdatePlanningRowInput } from '../types';

export async function fetchPlanningRows(tableId: string): Promise<PlanningRow[]> {
  const { data, error } = await supabase
    .from('planning_rows')
    .select('*')
    .eq('planning_table_id', tableId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as PlanningRow[];
}

export async function createPlanningRow(input: CreatePlanningRowInput): Promise<PlanningRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('planning_rows')
    .insert({
      planning_table_id: input.planning_table_id,
      parent_row_id: input.parent_row_id ?? null,
      level: input.level,
      name: input.name,
      content: input.content ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      color: input.color ?? null,
      display_order: input.display_order ?? 0,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PlanningRow;
}

export async function updatePlanningRow(id: string, input: UpdatePlanningRowInput): Promise<PlanningRow> {
  const { data, error } = await supabase
    .from('planning_rows')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as PlanningRow;
}

export async function deletePlanningRow(id: string): Promise<void> {
  const { error } = await supabase
    .from('planning_rows')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function reorderPlanningRows(rows: readonly { id: string; display_order: number }[]): Promise<void> {
  // Batch update display_order — same sequential pattern as reorderPhases
  for (const row of rows) {
    const { error } = await supabase
      .from('planning_rows')
      .update({ display_order: row.display_order })
      .eq('id', row.id);

    if (error) throw error;
  }
}

export async function changeRowLevel(
  id: string,
  newParentId: string | null,
  newLevel: 1 | 2 | 3
): Promise<PlanningRow> {
  const { data, error } = await supabase
    .from('planning_rows')
    .update({ parent_row_id: newParentId, level: newLevel })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as PlanningRow;
}
