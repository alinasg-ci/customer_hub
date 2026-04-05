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
        <h3 className="text-base font-semibold text-slate-900">Toggl Sync</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => toggleAutoSync(e.target.checked)}
              className="rounded border-slate-300"
            />
            Auto-sync (skip preview)
          </label>
          {previewEntries.length === 0 && (
            <button
              onClick={startPreview}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Preview Sync'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
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
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm">
            <span>{previewEntries.length} entries — {acceptedCount} to sync, {excludedCount} excluded</span>
            <div className="flex gap-2">
              <button
                onClick={acceptAll}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
              >
                Accept all
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {confirming ? 'Syncing...' : 'Confirm sync'}
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-slate-500">
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
                    className={`border-b border-slate-100 ${entry.action === 'exclude' ? 'bg-slate-50 opacity-50 line-through' : 'hover:bg-slate-50'}`}
                  >
                    <td className="py-2 px-3 text-slate-500">
                      {new Date(entry.start_time).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 font-medium">
                      {entry.duration_hours.toFixed(1)}h
                    </td>
                    <td className="py-2 px-3 text-slate-900 max-w-xs truncate">
                      {entry.description || '(no description)'}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {entry.toggl_project_name ?? '—'}
                    </td>
                    <td className="py-2 px-3">
                      {entry.action === 'reassign' ? (
                        <select
                          value={entry.reassigned_phase_id ?? ''}
                          onChange={(e) => setEntryAction(entry.toggl_entry_id, 'reassign', e.target.value || undefined)}
                          className="rounded-lg border border-slate-200 px-1 py-0.5 text-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                        >
                          <option value="">Unassigned</option>
                          {phases.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-400 text-xs">{entry.proposed_phase_name ?? 'Unassigned'}</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEntryAction(entry.toggl_entry_id, 'accept')}
                          className={`rounded-lg px-2 py-0.5 text-xs ${entry.action === 'accept' ? 'bg-emerald-100 text-emerald-700 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => setEntryAction(entry.toggl_entry_id, 'reassign')}
                          className={`rounded-lg px-2 py-0.5 text-xs ${entry.action === 'reassign' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                          Reassign
                        </button>
                        <button
                          onClick={() => setEntryAction(entry.toggl_entry_id, 'exclude')}
                          className={`rounded-lg px-2 py-0.5 text-xs ${entry.action === 'exclude' ? 'bg-red-100 text-red-700 font-medium' : 'text-slate-500 hover:bg-slate-100'}`}
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
