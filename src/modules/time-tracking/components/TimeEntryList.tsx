'use client';

import { useEffect } from 'react';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { Skeleton } from '@/shared/ui/Skeleton';

type TimeEntryListProps = {
  readonly projectId: string;
};

export function TimeEntryList({ projectId }: TimeEntryListProps) {
  const {
    entries,
    loading,
    syncing,
    error,
    totalHours,
    billableHours,
    nonBillableHours,
    sync,
  } = useTimeEntries(projectId);

  // Auto-sync on mount
  useEffect(() => {
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && entries.length === 0) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Time Entries</h3>
          <div className="flex gap-4 text-sm text-slate-500">
            <span>Total: <strong className="text-slate-900">{totalHours.toFixed(1)}h</strong></span>
            <span>Billable: <strong className="text-emerald-700">{billableHours.toFixed(1)}h</strong></span>
            <span>Non-billable: <strong className="text-slate-500">{nonBillableHours.toFixed(1)}h</strong></span>
          </div>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </div>
      )}

      {entries.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          No time entries yet. Connect Toggl in Settings to sync entries.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2 text-left font-medium text-slate-500">Date</th>
                <th className="px-3 py-2 text-left font-medium text-slate-500">Description</th>
                <th className="px-3 py-2 text-right font-medium text-slate-500">Hours</th>
                <th className="px-3 py-2 text-center font-medium text-slate-500">Billable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-slate-900">
                    {entry.description || <span className="text-slate-400 italic">No description</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900">
                    {entry.durationHours.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {entry.billable ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">Yes</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
