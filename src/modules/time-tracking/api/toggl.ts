import { supabase } from '@/shared/hooks/useSupabase';
import type { TogglConnection, TogglMapping, CachedTimeEntry } from '../types';

// --- Connection ---

export async function fetchTogglConnection(): Promise<TogglConnection | null> {
  const { data, error } = await supabase
    .from('toggl_connections')
    .select('*')
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return data as TogglConnection | null;
}

export async function saveTogglConnection(
  apiToken: string,
  workspaceId: string,
  workspaceName: string
): Promise<TogglConnection> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Deactivate any existing connection
  await supabase
    .from('toggl_connections')
    .update({ status: 'disconnected' })
    .eq('user_id', user.id)
    .eq('status', 'active');

  const { data, error } = await supabase
    .from('toggl_connections')
    .insert({
      api_token_encrypted: apiToken, // In production, encrypt with AES-256
      workspace_id: workspaceId,
      workspace_name: workspaceName,
      status: 'active',
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TogglConnection;
}

export async function disconnectToggl(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('toggl_connections')
    .update({ status: 'disconnected' })
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (error) throw error;
}

// --- Mappings ---

export async function fetchTogglMappings(): Promise<TogglMapping[]> {
  const { data, error } = await supabase
    .from('toggl_mappings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as TogglMapping[];
}

export async function createTogglMapping(
  projectId: string,
  togglProjectId: number,
  togglProjectName: string
): Promise<TogglMapping> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('toggl_mappings')
    .insert({
      project_id: projectId,
      toggl_project_id: togglProjectId,
      toggl_project_name: togglProjectName,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as TogglMapping;
}

export async function deleteTogglMapping(id: string): Promise<void> {
  const { error } = await supabase
    .from('toggl_mappings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// --- Cached entries ---

export async function fetchCachedEntries(projectId: string): Promise<CachedTimeEntry[]> {
  const { data, error } = await supabase
    .from('toggl_cached_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('start_time', { ascending: false });

  if (error) throw error;
  return data as CachedTimeEntry[];
}

export async function updateEntryPhase(
  entryId: string,
  phaseId: string | null,
  assignmentType: 'manual' | 'auto_keyword' | 'unassigned'
): Promise<void> {
  const { error } = await supabase
    .from('toggl_cached_entries')
    .update({
      phase_id: phaseId,
      phase_assignment_type: assignmentType,
    })
    .eq('id', entryId);

  if (error) throw error;
}

export async function updateLastSyncAt(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('toggl_connections')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', connectionId);

  if (error) throw error;
}
