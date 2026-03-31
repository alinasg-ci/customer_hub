import { supabase } from '@/shared/hooks/useSupabase';
import type { KeywordSource } from '@/shared/types';

export type PhaseKeyword = {
  readonly id: string;
  readonly phase_id: string;
  readonly keyword: string;
  readonly source: KeywordSource;
  readonly created_at: string;
  readonly user_id: string;
};

export async function fetchKeywordsByProject(projectId: string): Promise<PhaseKeyword[]> {
  // Get all phases for this project, then their keywords
  const { data: phases, error: phaseError } = await supabase
    .from('phases')
    .select('id')
    .eq('project_id', projectId);

  if (phaseError) throw phaseError;
  if (!phases || phases.length === 0) return [];

  const phaseIds = phases.map((p: { id: string }) => p.id);

  const { data, error } = await supabase
    .from('phase_keywords')
    .select('*')
    .in('phase_id', phaseIds)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as PhaseKeyword[];
}

export async function addKeyword(
  phaseId: string,
  keyword: string,
  source: KeywordSource = 'user_entered'
): Promise<PhaseKeyword> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('phase_keywords')
    .insert({
      phase_id: phaseId,
      keyword: keyword.toLowerCase().trim(),
      source,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PhaseKeyword;
}

export async function deleteKeyword(id: string): Promise<void> {
  const { error } = await supabase
    .from('phase_keywords')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
