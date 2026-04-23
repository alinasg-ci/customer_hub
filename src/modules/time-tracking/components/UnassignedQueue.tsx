'use client';

import { useState } from 'react';
import { usePhaseMapping } from '../hooks/usePhaseMapping';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { Phase } from '@/modules/planning';

type UnassignedQueueProps = {
  readonly projectId: string;
  readonly phases: readonly Phase[];
};

export function UnassignedQueue({ projectId, phases }: UnassignedQueueProps) {
  const {
    keywords,
    unassignedEntries,
    loading,
    error,
    runAutoAssign,
    manualAssign,
    learnKeyword,
    addUserKeyword,
    removeKeyword,
  } = usePhaseMapping(projectId);

  const [learningEntry, setLearningEntry] = useState<{
    entryId: string;
    description: string;
    phaseId: string;
  } | null>(null);
  const [learningKeyword, setLearningKeyword] = useState('');
  const [addingKeyword, setAddingKeyword] = useState<string | null>(null); // phase id
  const [newKeyword, setNewKeyword] = useState('');

  async function handleAssign(entryId: string, phaseId: string, description: string | null) {
    await manualAssign(entryId, phaseId);

    // Prompt to learn
    if (description) {
      setLearningEntry({ entryId, description, phaseId });
      // Suggest a keyword from the description (first 2-3 meaningful words)
      const words = description.trim().split(/\s+/).slice(0, 3).join(' ');
      setLearningKeyword(words.toLowerCase());
    }
  }

  async function handleConfirmLearn() {
    if (!learningEntry || !learningKeyword.trim()) return;
    await learnKeyword(learningEntry.phaseId, learningKeyword.trim());
    setLearningEntry(null);
    setLearningKeyword('');
  }

  async function handleAddKeyword(phaseId: string) {
    if (!newKeyword.trim()) return;
    await addUserKeyword(phaseId, newKeyword.trim());
    setNewKeyword('');
    setAddingKeyword(null);
  }

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black">Phase Mapping</h3>
        <button
          onClick={runAutoAssign}
          className="rounded-lg border border-oat-300 px-3 py-1.5 text-sm text-charcoal-700 hover:bg-cream"
        >
          Run Auto-Assign
        </button>
      </div>

      {error && (
        <p className="text-sm text-pomegranate-600">{error}</p>
      )}

      {/* Keywords per phase */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-charcoal-500">Keywords by Phase</h4>
        {phases.length === 0 ? (
          <p className="text-sm text-charcoal-300">Add phases first to set up keyword mapping.</p>
        ) : (
          phases.map((phase) => {
            const phaseKeywords = keywords.filter((k) => k.phase_id === phase.id);
            return (
              <div key={phase.id} className="rounded-xl border border-oat-300 bg-white px-3 py-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black">{phase.name}</span>
                  <button
                    onClick={() => setAddingKeyword(addingKeyword === phase.id ? null : phase.id)}
                    className="text-xs text-black hover:text-black"
                  >
                    + keyword
                  </button>
                </div>
                {phaseKeywords.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {phaseKeywords.map((kw) => (
                      <span
                        key={kw.id}
                        className="inline-flex items-center gap-1 rounded-full bg-oat-100 px-2 py-0.5 text-xs text-black"
                      >
                        {kw.keyword}
                        <button
                          onClick={() => removeKeyword(kw.id)}
                          className="rounded p-1 text-charcoal-300 hover:text-pomegranate-600"
                          aria-label={`Remove keyword ${kw.keyword}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {addingKeyword === phase.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="e.g. competitive analysis"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddKeyword(phase.id);
                      }}
                      className="flex-1 rounded-lg border border-oat-300 px-2 py-1 text-xs focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddKeyword(phase.id)}
                      className="rounded-lg bg-black px-2 py-1 text-xs text-white hover:bg-charcoal-900"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Unassigned entries queue */}
      <div>
        <h4 className="mb-2 text-sm font-medium text-charcoal-500">
          Unassigned Entries ({unassignedEntries.length})
        </h4>
        {unassignedEntries.length === 0 ? (
          <p className="text-sm text-charcoal-300">All entries are assigned.</p>
        ) : (
          <div className="space-y-1">
            {unassignedEntries.slice(0, 20).map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 rounded-xl border border-oat-300 bg-white px-3 py-1.5 text-sm shadow-sm">
                <span className="text-xs text-charcoal-300 shrink-0">
                  {new Date(entry.start_time).toLocaleDateString()}
                </span>
                <span className="flex-1 truncate text-charcoal-700">
                  {entry.description || <span className="italic text-charcoal-300">No description</span>}
                </span>
                <span className="shrink-0 text-xs text-charcoal-500">{entry.duration_hours}h</span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) handleAssign(entry.id, e.target.value, entry.description);
                  }}
                  className="shrink-0 rounded-lg border border-oat-300 px-1 py-0.5 text-xs focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  <option value="">Assign...</option>
                  {phases.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ))}
            {unassignedEntries.length > 20 && (
              <p className="text-xs text-charcoal-300">
                Showing first 20 of {unassignedEntries.length} unassigned entries.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Learning prompt */}
      {learningEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-oat-300 bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-semibold text-black">Learn this keyword?</h3>
            <p className="mb-3 text-sm text-charcoal-500">
              Always assign entries containing this keyword to{' '}
              <strong>{phases.find((p) => p.id === learningEntry.phaseId)?.name}</strong>?
            </p>
            <input
              type="text"
              value={learningKeyword}
              onChange={(e) => setLearningKeyword(e.target.value)}
              className="mb-3 block w-full rounded-lg border border-oat-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setLearningEntry(null); setLearningKeyword(''); }}
                className="rounded-lg px-3 py-1.5 text-sm text-charcoal-500 hover:text-charcoal-700 hover:bg-oat-200"
              >
                Skip
              </button>
              <button
                onClick={handleConfirmLearn}
                className="rounded-lg bg-black px-3 py-1.5 text-sm text-white hover:bg-charcoal-900"
              >
                Save Keyword
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
