'use client';

import { useSyncPreview } from '../hooks/useSyncPreview';
import { Skeleton } from '@/shared/ui/Skeleton';
import { formatHours } from '@/shared/utils/formatHours';
import type { Phase } from '@/modules/planning';

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
        <h3 className="text-base font-semibold text-black">Toggl Sync</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-charcoal-500">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => toggleAutoSync(e.target.checked)}
              className="rounded border-oat-500"
            />
            Auto-sync (skip preview)
          </label>
          {previewEntries.length === 0 && (
            <button
              onClick={startPreview}
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-900 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Preview Sync'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-pomegranate-400 bg-pomegranate-300/20 p-3">
          <p className="text-sm text-pomegranate-600">{error}</p>
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
          <div className="flex items-center justify-between rounded-xl bg-cream px-4 py-2 text-sm">
            <span>{previewEntries.length} entries — {acceptedCount} to sync, {excludedCount} excluded</span>
            <div className="flex gap-2">
              <button
                onClick={acceptAll}
                className="rounded-lg border border-oat-300 px-3 py-1 text-xs text-charcoal-700 hover:bg-oat-200"
              >
                Accept all
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="rounded-lg bg-matcha-600 px-3 py-1 text-xs font-medium text-white hover:bg-matcha-800 disabled:opacity-50"
              >
                {confirming ? 'Syncing...' : 'Confirm sync'}
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-xl border border-oat-300 shadow-sm">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-charcoal-500">
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
                    className={`border-b border-oat-200 ${entry.action === 'exclude' ? 'bg-cream opacity-50 line-through' : 'hover:bg-cream'}`}
                  >
                    <td className="py-2 px-3 text-charcoal-500">
                      {new Date(entry.start_time).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-3 font-medium">
                      {formatHours(entry.duration_hours)}
                    </td>
                    <td className="py-2 px-3 text-black max-w-xs truncate">
                      {entry.description || '(no description)'}
                    </td>
                    <td className="py-2 px-3 text-charcoal-500">
                      {entry.toggl_project_name ?? '—'}
                    </td>
                    <td className="py-2 px-3">
                      {entry.action === 'reassign' ? (
                        <select
                          value={entry.reassigned_phase_id ?? ''}
                          onChange={(e) => setEntryAction(entry.toggl_entry_id, 'reassign', e.target.value || undefined)}
                          className="rounded-lg border border-oat-300 px-1 py-0.5 text-xs focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                        >
                          <option value="">Unassigned</option>
                          {phases.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-charcoal-300 text-xs">{entry.proposed_phase_name ?? 'Unassigned'}</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEntryAction(entry.toggl_entry_id, 'accept')}
                          className={`rounded-lg px-2 py-0.5 text-xs ${entry.action === 'accept' ? 'bg-matcha-300/30 text-matcha-600 font-medium' : 'text-charcoal-500 hover:bg-oat-200'}`}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => setEntryAction(entry.toggl_entry_id, 'reassign')}
                          className={`rounded-lg px-2 py-0.5 text-xs ${entry.action === 'reassign' ? 'bg-oat-200 text-black font-medium' : 'text-charcoal-500 hover:bg-oat-200'}`}
                        >
                          Reassign
                        </button>
                        <button
                          onClick={() => setEntryAction(entry.toggl_entry_id, 'exclude')}
                          className={`rounded-lg px-2 py-0.5 text-xs ${entry.action === 'exclude' ? 'bg-pomegranate-300/30 text-pomegranate-600 font-medium' : 'text-charcoal-500 hover:bg-oat-200'}`}
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
