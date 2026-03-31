'use client';

import { useState, type FormEvent } from 'react';
import type { CreateManualEntryInput } from '../types';
import type { Phase } from '@/modules/planning/types';

type ManualEntryFormProps = {
  readonly projectId: string;
  readonly phases: readonly Phase[];
  readonly onSubmit: (input: CreateManualEntryInput) => Promise<void>;
  readonly onCancel: () => void;
};

export function ManualEntryForm({ projectId, phases, onSubmit, onCancel }: ManualEntryFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [phaseId, setPhaseId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hours || parseFloat(hours) <= 0) {
      setError('Hours must be greater than 0');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        project_id: projectId,
        date,
        hours: parseFloat(hours),
        description: description.trim() || undefined,
        billable,
        phase_id: phaseId || undefined,
        note: note.trim() || undefined,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Manual Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="me-date" className="block text-sm font-medium text-gray-700">Date *</label>
              <input id="me-date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="me-hours" className="block text-sm font-medium text-gray-700">Hours *</label>
              <input id="me-hours" type="number" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" autoFocus />
            </div>
          </div>
          <div>
            <label htmlFor="me-desc" className="block text-sm font-medium text-gray-700">Description</label>
            <input id="me-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="me-phase" className="block text-sm font-medium text-gray-700">Phase</label>
              <select id="me-phase" value={phaseId} onChange={(e) => setPhaseId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">None</option>
                {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)}
                  className="rounded border-gray-300" />
                Billable
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="me-note" className="block text-sm font-medium text-gray-700">Note</label>
            <textarea id="me-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
