'use client';

import { useEffect } from 'react';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { Skeleton } from '@/shared/ui/Skeleton';
import { formatHours } from '@/shared/utils/formatHours';

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
          <h3 className="text-lg font-semibold text-black">Time Entries</h3>
          <div className="flex gap-4 text-sm text-charcoal-500">
            <span>Total: <strong className="text-black">{formatHours(totalHours)}</strong></span>
            <span>Billable: <strong className="text-matcha-600">{formatHours(billableHours)}</strong></span>
            <span>Non-billable: <strong className="text-charcoal-500">{formatHours(nonBillableHours)}</strong></span>
          </div>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="rounded-lg border border-oat-300 px-3 py-1.5 text-sm font-medium text-charcoal-700 hover:bg-cream disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-lemon-700 bg-lemon-400/20 px-3 py-2 text-sm text-lemon-800">
          {error}
        </div>
      )}

      {entries.length === 0 ? (
        <p className="py-4 text-center text-sm text-charcoal-300">
          No time entries yet. Connect Toggl in Settings to sync entries.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-oat-300 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream">
                <th className="px-3 py-2 text-left font-medium text-charcoal-500">Date</th>
                <th className="px-3 py-2 text-left font-medium text-charcoal-500">Description</th>
                <th className="px-3 py-2 text-right font-medium text-charcoal-500">Hours</th>
                <th className="px-3 py-2 text-center font-medium text-charcoal-500">Billable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oat-200">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-3 py-2 text-charcoal-500">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-black">
                    {entry.description || <span className="text-charcoal-300 italic">No description</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-black">
                    {entry.durationHours.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {entry.billable ? (
                      <span className="inline-flex rounded-full bg-matcha-300/30 px-1.5 py-0.5 text-xs text-matcha-600">Yes</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-oat-200 px-1.5 py-0.5 text-xs text-charcoal-500">No</span>
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
