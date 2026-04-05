'use client';

import { useState } from 'react';
import { useReport } from '../hooks/useReport';
import { ManualEntryForm } from './ManualEntryForm';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn } from '@/shared/utils/cn';
import type { Phase } from '@/modules/planning';
import type { GroupBy, SortBy } from '../types';

type ReportTableProps = {
  readonly projectId: string;
  readonly phases: readonly Phase[];
};

const GROUP_OPTIONS: readonly { value: GroupBy; label: string }[] = [
  { value: 'phase', label: 'Phase' },
  { value: 'date', label: 'Date' },
  { value: 'description', label: 'Description' },
  { value: 'billable', label: 'Billable Status' },
];

export function ReportTable({ projectId, phases }: ReportTableProps) {
  const {
    grouped,
    loading,
    error,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    filter,
    setFilter,
    totalHours,
    billableHours,
    selectedIds,
    selectedSubtotal,
    toggleSelect,
    clearSelection,
    addManualEntry,
    removeManualEntry,
    exportCsv,
  } = useReport(projectId, phases);

  const [showManualForm, setShowManualForm] = useState(false);

  function handleSort(col: SortBy) {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  }

  if (loading) return <Skeleton className="h-48 w-full" />;

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Project Report</h3>
          <div className="flex gap-4 text-sm text-slate-500">
            <span>Total: <strong className="text-slate-900">{totalHours.toFixed(1)}h</strong></span>
            <span>Billable: <strong className="text-emerald-700">{billableHours.toFixed(1)}h</strong></span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowManualForm(true)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
            + Manual Entry
          </button>
          <button onClick={exportCsv}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Export CSV
          </button>
        </div>
      </div>

      {/* Controls: Group + Filter */}
      <div className="mb-3 flex flex-wrap gap-2">
        <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20">
          {GROUP_OPTIONS.map((o) => <option key={o.value} value={o.value}>Group: {o.label}</option>)}
        </select>
        <input type="date" value={filter.dateFrom ?? ''} onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value || undefined })}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20" placeholder="From" />
        <input type="date" value={filter.dateTo ?? ''} onChange={(e) => setFilter({ ...filter, dateTo: e.target.value || undefined })}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20" placeholder="To" />
        <select value={filter.phaseId ?? ''} onChange={(e) => setFilter({ ...filter, phaseId: e.target.value || undefined })}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20">
          <option value="">All phases</option>
          {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filter.billable === undefined ? '' : filter.billable ? 'true' : 'false'}
          onChange={(e) => setFilter({ ...filter, billable: e.target.value === '' ? undefined : e.target.value === 'true' })}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20">
          <option value="">All</option>
          <option value="true">Billable</option>
          <option value="false">Non-billable</option>
        </select>
      </div>

      {/* Selected subtotal */}
      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm">
          <span className="font-medium text-indigo-800">
            {selectedIds.size} selected: {selectedSubtotal.toFixed(2)}h
          </span>
          <button onClick={clearSelection} className="text-xs text-indigo-600 hover:text-indigo-800">
            Clear
          </button>
        </div>
      )}

      {/* Grouped table */}
      {grouped.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No entries match the current filters.</p>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.groupKey} className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
                <span className="text-sm font-semibold text-slate-700">{group.groupLabel}</span>
                <span className="text-sm font-medium text-slate-900">{group.totalHours.toFixed(2)}h</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="w-8 px-3 py-1.5"></th>
                    <th className="px-3 py-1.5 text-left">
                      <button onClick={() => handleSort('date')} className="font-medium text-slate-500 hover:text-slate-700">
                        Date {sortBy === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </button>
                    </th>
                    <th className="px-3 py-1.5 text-left">
                      <button onClick={() => handleSort('description')} className="font-medium text-slate-500 hover:text-slate-700">
                        Description {sortBy === 'description' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </button>
                    </th>
                    <th className="px-3 py-1.5 text-right">
                      <button onClick={() => handleSort('hours')} className="font-medium text-slate-500 hover:text-slate-700">
                        Hours {sortBy === 'hours' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </button>
                    </th>
                    <th className="px-3 py-1.5 text-center font-medium text-slate-500">Billable</th>
                    <th className="px-3 py-1.5 text-center font-medium text-slate-500">Source</th>
                    <th className="w-8 px-3 py-1.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {group.entries.map((entry) => (
                    <tr key={entry.id} className={cn(
                      'hover:bg-slate-50',
                      selectedIds.has(entry.id) && 'bg-indigo-50'
                    )}>
                      <td className="px-3 py-1.5">
                        <input type="checkbox" checked={selectedIds.has(entry.id)}
                          onChange={() => toggleSelect(entry.id)}
                          className="rounded border-slate-300" />
                      </td>
                      <td className="px-3 py-1.5 text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="px-3 py-1.5 text-slate-900">
                        {entry.description || <span className="italic text-slate-400">No description</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium text-slate-900">{entry.hours.toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-center">
                        {entry.billable
                          ? <span className="text-xs text-emerald-700">Yes</span>
                          : <span className="text-xs text-slate-400">No</span>}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <span className={cn(
                          'inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                          entry.source === 'toggl' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                        )}>
                          {entry.source === 'toggl' ? 'Toggl' : 'Manual'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5">
                        {entry.source === 'manual' && (
                          <button onClick={() => removeManualEntry(entry.id)}
                            className="text-xs text-slate-300 hover:text-red-500">x</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {showManualForm && (
        <ManualEntryForm
          projectId={projectId}
          phases={phases}
          onSubmit={async (input) => { await addManualEntry(input); setShowManualForm(false); }}
          onCancel={() => setShowManualForm(false)}
        />
      )}
    </div>
  );
}
