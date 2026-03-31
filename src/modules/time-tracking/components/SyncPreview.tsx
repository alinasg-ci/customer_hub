'use client';

import { useSyncPreview } from '../hooks/useSyncPreview';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { Phase } from '@/modules/planning/types';

type SyncPreviewProps = {
  readonly phases: readonly Phase[];
  readonly onSyncComplete: () => void;
};

export function SyncPreview({ phases, onSyncComplete }: SyncPreviewProps) {
  const {
    previewEntries,
    loading,
    confirming,
    error,
    autoSync,
    toggleAutoSync,
    startPreview,
    setEntryAction,
    acceptAll,
    confirmSync,
  } = useSyncPreview();

  const handleConfirm = async () => {
    await confirmSync();
    onSyncComplete();
  };

  const excludedCount = previewEntries.filter((e) => e.action === 'exclude').length;
  const acceptedCount = previewEntries.filter((e) => e.action === 'accept' || e.action === 'reassign').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Toggl Sync</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => toggleAutoSync(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-sync (skip preview)
          </label>
          {previewEntries.length === 0 && (
            <button
              onClick={startPreview}
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Preview Sync'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {previewEntries.length > 0 && (
        <>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 text-sm">
            <span>{previewEntries.length} entries — {acceptedCount} to sync, {excludedCount} excluded</span>
            <div className="flex gap-2">
              <button
                onClick={acceptAll}
                className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100"
              >
                Accept all
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {confirming ? 'Syncing...' : 'Confirm sync'}
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Duration</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Project</th>
                  <th className="py-2 px-3">Phase</th>
                  <th className="py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {previewEntries.map((entry) => (
                  <tr
                    key={entry.toggl_entry_id}
                    className={`border-b border-gray-100 ${entry.action === 'exclude' ? 'bg-gray-50 opacity-50 line-through' : 'hover:bg-gray-50'}`}
                  >
                    <td className="py-2 px-3 text-gray-600">
                      {new Date(entry.start_time).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 font-medium">
                      {entry.duration_hours.toFixed(1)}h
                    </td>
                    <td className="py-2 px-3 text-gray-900 max-w-xs truncate">
                      {entry.description || '(no description)'}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {entry.toggl_project_name ?? '—'}
                    </td>
                    <td className="py-2 px-3">
                      {entry.action === 'reassign' ? (
                        <select
                          value={entry.reassigned_phase_id ?? ''}
                          onChange={(e) => setEntryAction(entry.toggl_entry_id, 'reassign', e.target.value || undefined)}
                          className="rounded border border-gray-200 px-1 py-0.5 text-xs"
                        >
                          <option value="">Unassigned</option>
                          {phases.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-400 text-xs">{entry.proposed_phase_name ?? 'Unassigned'}</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEntryAction(entry.toggl_entry_id, 'accept')}
                          className={`rounded px-2 py-0.5 text-xs ${entry.action === 'accept' ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => setEntryAction(entry.toggl_entry_id, 'reassign')}
                          className={`rounded px-2 py-0.5 text-xs ${entry.action === 'reassign' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                          Reassign
                        </button>
                        <button
                          onClick={() => setEntryAction(entry.toggl_entry_id, 'exclude')}
                          className={`rounded px-2 py-0.5 text-xs ${entry.action === 'exclude' ? 'bg-red-100 text-red-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                          Exclude
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
