import { supabase } from '@/shared/hooks/useSupabase';
import type { Phase, CreatePhaseInput, UpdatePhaseInput } from '../types';

export async function fetchPhases(projectId: string): Promise<Phase[]> {
  const { data, error } = await supabase
    .from('phases')
    .select('*')
    .eq('project_id', projectId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as Phase[];
}

export async function createPhase(input: CreatePhaseInput): Promise<Phase> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('phases')
    .insert({
      project_id: input.project_id,
      sub_project_id: input.sub_project_id ?? null,
      name: input.name,
      quoted_hours: input.quoted_hours ?? 0,
      internal_planned_hours: input.internal_planned_hours ?? 0,
      display_order: input.display_order ?? 0,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Phase;
}

export async function updatePhase(id: string, input: UpdatePhaseInput): Promise<Phase> {
  const { data, error } = await supabase
    .from('phases')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Phase;
}

export async function deletePhase(id: string): Promise<void> {
  const { error } = await supabase
    .from('phases')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function reorderPhases(phases: readonly { id: string; display_order: number }[]): Promise<void> {
  // Update each phase's display_order individually
  // Supabase doesn't support bulk update natively, so we batch these
  const promises = phases.map(({ id, display_order }) =>
    supabase
      .from('phases')
      .update({ display_order })
      .eq('id', id)
  );

  const results = await Promise.all(promises);
  const firstError = results.find((r) => r.error);
  if (firstError?.error) throw firstError.error;
}
