'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchNotes, createNote, deleteNote } from '../api/notesApi';
import type { Note, CreateNoteInput } from '../types';
import type { NoteParentType } from '@/shared/types';

export function useNotes(parentType: NoteParentType, parentId: string) {
  const [notes, setNotes] = useState<readonly Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotes(parentType, parentId);
      setNotes(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load notes';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [parentType, parentId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (text: string) => {
    const input: CreateNoteInput = { parent_type: parentType, parent_id: parentId, text };
    const created = await createNote(input);
    setNotes((prev) => [created, ...prev]);
    return created;
  }, [parentType, parentId]);

  const remove = useCallback(async (id: string) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notes, loading, error, add, remove, reload: load };
}
