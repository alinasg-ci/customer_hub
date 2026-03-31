import { supabase } from '@/shared/hooks/useSupabase';
import type { Note, CreateNoteInput } from '../types';
import type { NoteParentType } from '@/shared/types';

export async function fetchNotes(parentType: NoteParentType, parentId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('parent_type', parentType)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Note[];
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notes')
    .insert({
      parent_type: input.parent_type,
      parent_id: input.parent_id,
      text: input.text,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Note;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
