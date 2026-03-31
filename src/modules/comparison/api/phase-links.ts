import { supabase } from '@/shared/hooks/useSupabase';
import type { PhaseLink, CreatePhaseLinkInput, UpdatePhaseLinkInput } from '../types';

export async function fetchPhaseLinks(projectId: string): Promise<PhaseLink[]> {
  const { data, error } = await supabase
    .from('phase_links')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as PhaseLink[];
}

export async function createPhaseLink(input: CreatePhaseLinkInput): Promise<PhaseLink> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('phase_links')
    .insert({
      project_id: input.project_id,
      canonical_name: input.canonical_name,
      budget_phase_id: input.budget_phase_id ?? null,
      plan_phase_id: input.plan_phase_id ?? null,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PhaseLink;
}

export async function updatePhaseLink(id: string, input: UpdatePhaseLinkInput): Promise<PhaseLink> {
  const { data, error } = await supabase
    .from('phase_links')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as PhaseLink;
}

export async function deletePhaseLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('phase_links')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
