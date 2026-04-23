'use client';

import { useState, useCallback } from 'react';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
import { Skeleton } from '@/shared/ui/Skeleton';
import { formatHours } from '@/shared/utils/formatHours';
import type { ManualTimeEntry, UpdateManualEntryInput } from '@/modules/reports';
import type { Phase, Task } from '@/modules/planning';

type RecordedTimeTableProps = {
  readonly entries: readonly ManualTimeEntry[];
  readonly phases: readonly Phase[];
  readonly tasks: readonly Task[];
  readonly loading: boolean;
  readonly totalHours: number;
  readonly onEdit: (id: string, input: UpdateManualEntryInput) => Promise<void>;
  readonly onDelete: (id: string) => Promise<void>;
  readonly onAdd: () => void;
};

function formatTime(isoString: string | null): string {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getPhaseName(phaseId: string | null, phases: readonly Phase[]): string {
  if (!phaseId) return '—';
  return phases.find((p) => p.id === phaseId)?.name ?? 'Unknown';
}

function getTaskName(taskId: string | null, tasks: readonly Task[]): string {
  if (!taskId) return '—';
  return tasks.find((t) => t.id === taskId)?.name ?? 'Unknown';
}

export function RecordedTimeTable({
  entries,
  phases,
  tasks,
  loading,
  totalHours,
  onEdit,
  onDelete,
  onAdd,
}: RecordedTimeTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<UpdateManualEntryInput & { task_id?: string | null }>>({});

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await onDelete(deletingId);
      setDeletingId(null);
    } catch {
      // Error handled upstream
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingId, onDelete]);

  const startEditing = useCallback((entry: ManualTimeEntry) => {
    setEditingId(entry.id);
    setEditDraft({
      description: entry.description,
      phase_id: entry.phase_id,
      task_id: entry.task_id,
      billable: entry.billable,
      hours: entry.hours,
    });
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId) return;
    await onEdit(editingId, editDraft);
    setEditingId(null);
    setEditDraft({});
  }, [editingId, editDraft, onEdit]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditDraft({});
  }, []);

  // Tasks filtered by the currently editing phase
  const editPhaseTasks = editDraft.phase_id
    ? tasks.filter((t) => t.phase_id === editDraft.phase_id)
    : [];

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-sm text-charcoal-500">
            Total: <strong className="text-black">{formatHours(totalHours)}</strong>
          </span>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg border border-oat-300 px-3 py-1.5 text-sm text-charcoal-500 hover:bg-oat-100"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Entry
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-oat-300 p-8 text-center">
          <p className="text-sm text-charcoal-500">No time entries yet. Use the Record button above or add entries manually.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-oat-300 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-oat-300 bg-cream/80 text-left text-[11px] font-semibold uppercase tracking-widest text-oat-500">
                <th className="py-2.5 pl-4 pr-2">Phase</th>
                <th className="py-2.5 px-3">Task</th>
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3 text-right">Duration</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-center">Billable</th>
                <th className="py-2.5 px-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isEditing = editingId === entry.id;

                return (
                  <tr key={entry.id} className="group border-b border-oat-100 hover:bg-oat-100">
                    {/* Phase */}
                    <td className="py-2.5 pl-4 pr-2">
                      {isEditing ? (
                        <select
                          value={editDraft.phase_id ?? ''}
                          onChange={(e) => setEditDraft((d) => ({ ...d, phase_id: e.target.value || null, task_id: null }))}
                          className="clay-input text-xs px-2 py-1"
                        >
                          <option value="">Select phase</option>
                          {phases.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-charcoal-700">{getPhaseName(entry.phase_id, phases)}</span>
                      )}
                    </td>

                    {/* Task */}
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <select
                          value={editDraft.task_id ?? ''}
                          onChange={(e) => setEditDraft((d) => ({ ...d, task_id: e.target.value || null }))}
                          disabled={editPhaseTasks.length === 0}
                          className="clay-input text-xs px-2 py-1 disabled:opacity-50"
                        >
                          <option value="">{editPhaseTasks.length === 0 ? 'Select phase first' : 'Select task'}</option>
                          {editPhaseTasks.map((t) => (
                            <option key={t.id} value={t.id}>{t.name || 'Untitled'}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-charcoal-500">{getTaskName(entry.task_id, tasks)}</span>
                      )}
                    </td>

                    {/* Date / Time */}
                    <td className="py-2.5 px-3 text-charcoal-500">
                      <div>{formatDate(entry.date)}</div>
                      {entry.start_time && entry.end_time && (
                        <div className="text-xs text-oat-500">
                          {formatTime(entry.start_time)} → {formatTime(entry.end_time)}
                        </div>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="py-2.5 px-3 text-right font-medium text-black">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={editDraft.hours ?? entry.hours}
                          onChange={(e) => setEditDraft((d) => ({ ...d, hours: parseFloat(e.target.value) || 0 }))}
                          className="clay-input w-16 text-right text-xs px-2 py-1"
                        />
                      ) : (
                        formatHours(entry.hours)
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-2.5 px-3 text-charcoal-500 max-w-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDraft.description ?? entry.description ?? ''}
                          onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value || null }))}
                          className="clay-input w-full text-xs px-2 py-1"
                          placeholder="Description..."
                        />
                      ) : (
                        <span className="truncate block">{entry.description || '—'}</span>
                      )}
                    </td>

                    {/* Billable */}
                    <td className="py-2.5 px-3 text-center">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editDraft.billable ?? entry.billable}
                          onChange={(e) => setEditDraft((d) => ({ ...d, billable: e.target.checked }))}
                          className="rounded border-oat-300"
                        />
                      ) : (
                        <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${
                          entry.billable
                            ? 'bg-matcha-300/20 text-matcha-800 border-matcha-500'
                            : 'bg-oat-100 text-charcoal-500 border-oat-300'
                        }`}>
                          {entry.billable ? 'Billable' : 'Non-billable'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={saveEdit}
                            className="rounded-lg p-1.5 text-matcha-600 hover:bg-matcha-300/20"
                            aria-label="Save"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-lg p-1.5 text-oat-500 hover:bg-oat-100"
                            aria-label="Cancel"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => startEditing(entry)}
                            className="rounded-lg p-1.5 text-oat-500 hover:bg-oat-100 hover:text-charcoal-500"
                            aria-label="Edit"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletingId(entry.id)}
                            className="rounded-lg p-1.5 text-oat-500 hover:bg-pomegranate-300/20 hover:text-pomegranate-600"
                            aria-label="Delete"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDeleteDialog
        open={deletingId !== null}
        title="Delete time entry"
        message="Permanently delete this time entry? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
