import { supabase } from '@/shared/hooks/useSupabase';
import type { Project, SubProject, CreateProjectInput, UpdateProjectInput, CreateSubProjectInput, UpdateSubProjectInput } from '../types';

export async function fetchProjectsByClient(clientId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Project[];
}

export async function fetchProjectById(id: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Project;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const autoCalc = computeAutoFields(input);

  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...input,
      ...autoCalc,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProjectStatus(id: string, status: 'active' | 'pending' | 'closed'): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

// Sub-projects

export async function fetchSubProjects(projectId: string): Promise<SubProject[]> {
  const { data, error } = await supabase
    .from('sub_projects')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as SubProject[];
}

export async function createSubProject(input: CreateSubProjectInput): Promise<SubProject> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const billedHours = input.billed_hours ?? input.allocated_hours ?? null;

  const { data, error } = await supabase
    .from('sub_projects')
    .insert({
      ...input,
      billed_hours: billedHours,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as SubProject;
}

export async function updateSubProject(id: string, input: UpdateSubProjectInput): Promise<SubProject> {
  const { data, error } = await supabase
    .from('sub_projects')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SubProject;
}

export async function deleteSubProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('sub_projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Auto-calculation helpers

function computeAutoFields(input: CreateProjectInput) {
  const fields: Record<string, unknown> = {};

  if (input.type === 'project' || input.type === 'hour_bank') {
    const rate = input.rate_per_hour ?? 0;
    const hours = input.total_scoped_hours ?? 0;
    const currency = input.rate_currency ?? 'ILS';

    // For M1, no currency conversion yet (Step 8). Store same value as ILS placeholder.
    fields.rate_per_hour_ils = rate;
    fields.total_fee = rate * hours;
    fields.total_fee_currency = currency;
    fields.total_fee_ils = rate * hours;
  }

  if (input.type === 'retainer') {
    const fee = input.retainer_fee ?? 0;
    const currency = input.retainer_fee_currency ?? 'ILS';

    // Placeholder — real conversion in Step 8
    fields.retainer_fee_ils = fee;
    fields.total_fee = fee;
    fields.total_fee_currency = currency;
    fields.total_fee_ils = fee;
  }

  return fields;
}
