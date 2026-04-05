'use client';

import { useState, type FormEvent } from 'react';
import { useNotes } from '../hooks/useNotes';
import type { NoteParentType } from '@/shared/types';

type NoteListProps = {
  readonly parentType: NoteParentType;
  readonly parentId: string;
};

export function NoteList({ parentType, parentId }: NoteListProps) {
  const { notes, loading, error, add, remove } = useNotes(parentType, parentId);
  const [newText, setNewText] = useState('');
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;

    await add(newText.trim());
    setNewText('');
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-700">Notes</h4>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            + Add note
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="mb-3">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Write a note..."
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            autoFocus
          />
          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setAdding(false); setNewText(''); }}
              className="rounded-lg px-3 py-1 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-700"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-xs text-slate-400">Loading notes...</p>
      ) : error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-slate-400">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="group rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
              <p className="whitespace-pre-wrap text-sm text-slate-800">{note.text}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-slate-400">{formatDate(note.created_at)}</span>
                <button
                  onClick={() => remove(note.id)}
                  className="text-xs text-slate-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
