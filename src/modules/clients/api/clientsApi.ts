import { supabase } from '@/shared/hooks/useSupabase';
import type { Client, CreateClientInput, UpdateClientInput } from '../types';

export async function fetchClients(status: 'active' | 'archived' = 'active'): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Client[];
}

export async function fetchClientById(id: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Client;
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: input.name,
      company: input.company ?? null,
      email_domains: input.email_domains ?? [],
      contact_emails: input.contact_emails ?? [],
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function archiveClient(id: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function reactivateClient(id: string): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({
      status: 'active',
      archived_at: null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string): Promise<void> {
  // Notes use polymorphic parent_type/parent_id with no FK —
  // cascade delete won't clean them up. Gather related IDs first.
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('client_id', id);

  const projectIds = (projects ?? []).map((p: { id: string }) => p.id);

  if (projectIds.length > 0) {
    // Fetch phases and sub_projects for note cleanup
    const [{ data: phases }, { data: subProjects }] = await Promise.all([
      supabase.from('phases').select('id').in('project_id', projectIds),
      supabase.from('sub_projects').select('id').in('project_id', projectIds),
    ]);

    const phaseIds = (phases ?? []).map((p: { id: string }) => p.id);
    const subProjectIds = (subProjects ?? []).map((s: { id: string }) => s.id);

    // Delete orphan-prone notes for all related entities
    if (projectIds.length > 0) {
      await supabase.from('notes').delete().eq('parent_type', 'project').in('parent_id', projectIds);
    }
    if (phaseIds.length > 0) {
      await supabase.from('notes').delete().eq('parent_type', 'phase').in('parent_id', phaseIds);
    }
    if (subProjectIds.length > 0) {
      await supabase.from('notes').delete().eq('parent_type', 'sub_project').in('parent_id', subProjectIds);
    }
  }

  // Now delete the client — CASCADE handles projects and all their children
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

function escapeIlikePattern(input: string): string {
  return input.replace(/[%_\\]/g, (ch) => `\\${ch}`);
}

export async function searchClients(query: string, status: 'active' | 'archived' = 'active'): Promise<Client[]> {
  const escaped = escapeIlikePattern(query);
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('status', status)
    .ilike('name', `%${escaped}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Client[];
}
