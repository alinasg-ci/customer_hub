'use client';

import { useState, type FormEvent } from 'react';
import { useSubProjects } from '../hooks/useSubProjects';
import { Skeleton } from '@/shared/ui/Skeleton';

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
    return <Skeleton className="h-24 w-full" />;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">Sub-projects</h4>
        <span className={cn('text-xs', overAllocated ? 'text-red-600 font-medium' : 'text-gray-500')}>
          {totalAllocated} / {totalBankHours ?? '?'} hrs allocated
          {overAllocated && ' (exceeds bank total)'}
        </span>
      </div>

      {subProjects.length === 0 && !showAddForm && (
        <p className="text-sm text-gray-400 mb-2">No sub-projects yet.</p>
      )}

      <div className="space-y-2">
        {subProjects.map((sp) => (
          <div key={sp.id} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-sm">
            <div>
              <span className="font-medium text-gray-800">{sp.name}</span>
              {sp.description && (
                <span className="ml-2 text-gray-400">{sp.description}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500">
                {sp.allocated_hours ?? '-'} hrs
              </span>
              <button
                onClick={() => remove(sp.id)}
                className="text-gray-400 hover:text-red-500"
                aria-label={`Remove ${sp.name}`}
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddForm ? (
        <form onSubmit={handleAdd} className="mt-2 flex gap-2">
          <input
            type="text"
            placeholder="Sub-project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <input
            type="number"
            placeholder="Hours"
            step="0.5"
            value={newHours}
            onChange={(e) => setNewHours(e.target.value)}
            className="w-20 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
            Add
          </button>
          <button type="button" onClick={() => setShowAddForm(false)} className="px-2 text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          + Add sub-project
        </button>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
