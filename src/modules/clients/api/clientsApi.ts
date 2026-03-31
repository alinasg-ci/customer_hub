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

export async function searchClients(query: string, status: 'active' | 'archived' = 'active'): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('status', status)
    .ilike('name', `%${query}%`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Client[];
}
