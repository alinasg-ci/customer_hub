'use client';

import { useState, type FormEvent } from 'react';
import type { CreateManualEntryInput } from '../types';
import type { Phase, Task } from '@/modules/planning';

export type ManualEntryDefaults = {
  readonly date?: string;
  readonly hours?: number;
  readonly description?: string;
  readonly phaseId?: string;
  readonly taskId?: string;
  readonly note?: string;
  readonly billable?: boolean;
};

type ManualEntryFormProps = {
  readonly projectId: string;
  readonly phases: readonly Phase[];
  readonly tasks?: readonly Task[];
  readonly defaults?: ManualEntryDefaults;
  readonly onSubmit: (input: CreateManualEntryInput) => Promise<void>;
  readonly onCancel: () => void;
};

export function ManualEntryForm({ projectId, phases, tasks = [], defaults, onSubmit, onCancel }: ManualEntryFormProps) {
  const [date, setDate] = useState(defaults?.date ?? new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(defaults?.hours !== undefined ? String(defaults.hours) : '');
  const [description, setDescription] = useState(defaults?.description ?? '');
  const [billable, setBillable] = useState(defaults?.billable ?? true);
  const [phaseId, setPhaseId] = useState(defaults?.phaseId ?? '');
  const [taskId, setTaskId] = useState(defaults?.taskId ?? '');
  const [note, setNote] = useState(defaults?.note ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phaseTasks = phaseId ? tasks.filter((t) => t.phase_id === phaseId) : [];

  const handlePhaseChange = (value: string) => {
    setPhaseId(value);
    setTaskId(''); // reset task when phase changes
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!phaseId) {
      setError('Phase is required');
      return;
    }
    if (phaseTasks.length > 0 && !taskId) {
      setError('Task is required');
      return;
    }
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
        phase_id: phaseId,
        task_id: taskId || undefined,
        note: note.trim() || undefined,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "clay-input w-full text-sm mt-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-oat-300 bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-black">Add Time Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phase + Task (required) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="me-phase" className="block text-sm font-medium text-charcoal-700">Phase <span className="text-pomegranate-400">*</span></label>
              <select id="me-phase" value={phaseId} onChange={(e) => handlePhaseChange(e.target.value)} className={inputClass}>
                <option value="">Select phase</option>
                {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="me-task" className="block text-sm font-medium text-charcoal-700">Task {phaseTasks.length > 0 && <span className="text-pomegranate-400">*</span>}</label>
              <select
                id="me-task"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                disabled={!phaseId || phaseTasks.length === 0}
                className={`${inputClass} disabled:opacity-50`}
              >
                <option value="">
                  {!phaseId ? 'Select phase first' : phaseTasks.length === 0 ? 'No tasks' : 'Select task'}
                </option>
                {phaseTasks.map((t) => <option key={t.id} value={t.id}>{t.name || 'Untitled'}</option>)}
              </select>
            </div>
          </div>

          {/* Date + Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="me-date" className="block text-sm font-medium text-charcoal-700">Date <span className="text-pomegranate-400">*</span></label>
              <input id="me-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="me-hours" className="block text-sm font-medium text-charcoal-700">Hours <span className="text-pomegranate-400">*</span></label>
              <input id="me-hours" type="number" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} className={inputClass} autoFocus />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="me-desc" className="block text-sm font-medium text-charcoal-700">Description</label>
            <input id="me-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>

          {/* Billable + Note */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-charcoal-700">
                <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} className="rounded border-oat-300" />
                Billable
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="me-note" className="block text-sm font-medium text-charcoal-700">Note</label>
            <textarea id="me-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
          </div>

          {error && <p className="text-sm text-pomegranate-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="rounded-lg border border-oat-300 px-4 py-2 text-sm font-medium text-charcoal-700 hover:bg-oat-100">Cancel</button>
            <button type="submit" disabled={submitting}
              className="clay-btn clay-btn-primary text-sm disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
