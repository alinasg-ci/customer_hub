'use client';

import { useState, type FormEvent } from 'react';
import { useSubProjects } from '../hooks/useSubProjects';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn } from '@/shared/utils/cn';

type SubProjectListProps = {
  readonly projectId: string;
  readonly totalBankHours: number | null;
};

export function SubProjectList({ projectId, totalBankHours }: SubProjectListProps) {
  const { subProjects, loading, error, add, edit, remove, totalAllocated } = useSubProjects(projectId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newHours, setNewHours] = useState('');

  const overAllocated = totalBankHours !== null && totalAllocated > totalBankHours;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    const hours = parseFloat(newHours) || undefined;
    await add({
      project_id: projectId,
      name: newName.trim(),
      allocated_hours: hours,
      billed_hours: hours,
    });
    setNewName('');
    setNewHours('');
    setShowAddForm(false);
  }

  if (loading) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-900">Sub-projects</h4>
        <span className={cn('text-xs', overAllocated ? 'text-red-600 font-medium' : 'text-slate-500')}>
          {totalAllocated} / {totalBankHours ?? '?'} hrs allocated
          {overAllocated && ' (exceeds bank total)'}
        </span>
      </div>

      {subProjects.length === 0 && !showAddForm && (
        <p className="text-sm text-slate-400 mb-2">No sub-projects yet.</p>
      )}

      <div className="space-y-2">
        {subProjects.map((sp) => (
          <div key={sp.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm">
            <div>
              <span className="font-medium text-slate-800">{sp.name}</span>
              {sp.description && (
                <span className="ml-2 text-slate-400">{sp.description}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">
                {sp.allocated_hours ?? '-'} hrs
              </span>
              <button
                onClick={() => remove(sp.id)}
                className="text-slate-400 transition-colors hover:text-red-500"
                aria-label={`Remove ${sp.name}`}
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddForm ? (
        <form onSubmit={handleAdd} className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Sub-project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            autoFocus
          />
          <input
            type="number"
            placeholder="Hours"
            step="0.5"
            value={newHours}
            onChange={(e) => setNewHours(e.target.value)}
            className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
            Add
          </button>
          <button type="button" onClick={() => setShowAddForm(false)} className="px-2 text-sm text-slate-500 transition-colors hover:text-slate-700">
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-3 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800"
        >
          + Add sub-project
        </button>
      )}
    </div>
  );
}
