import { supabase } from '@/shared/hooks/useSupabase';
import type { PlanningTable } from '../types';

export async function fetchPlanningTable(projectId: string): Promise<PlanningTable | null> {
  const { data, error } = await supabase
    .from('planning_tables')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) throw error;
  return data as PlanningTable | null;
}

export async function createPlanningTable(projectId: string, clientId: string): Promise<PlanningTable> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('planning_tables')
    .insert({
      project_id: projectId,
      client_id: clientId,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PlanningTable;
}

export async function fetchOrCreatePlanningTable(projectId: string, clientId: string): Promise<PlanningTable> {
  const existing = await fetchPlanningTable(projectId);
  if (existing) return existing;
  return createPlanningTable(projectId, clientId);
}
