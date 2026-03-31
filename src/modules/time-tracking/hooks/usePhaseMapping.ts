'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchKeywordsByProject, addKeyword, deleteKeyword, type PhaseKeyword } from '../api/keywords';
import { fetchCachedEntries, updateEntryPhase } from '../api/toggl';
import { matchAllUnassigned } from '../matching';
import type { CachedTimeEntry } from '../types';

export function usePhaseMapping(projectId: string) {
  const [keywords, setKeywords] = useState<readonly PhaseKeyword[]>([]);
  const [unassignedEntries, setUnassignedEntries] = useState<readonly CachedTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kws, entries] = await Promise.all([
        fetchKeywordsByProject(projectId),
        fetchCachedEntries(projectId),
      ]);
      setKeywords(kws);
      setUnassignedEntries(entries.filter((e) => e.phase_assignment_type === 'unassigned'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Run auto-assignment on all unassigned entries
  const runAutoAssign = useCallback(async () => {
    const allEntries = await fetchCachedEntries(projectId);
    const matches = matchAllUnassigned(allEntries, keywords);

    for (const match of matches) {
      await updateEntryPhase(match.entryId, match.phaseId, 'auto_keyword');
    }

    // Reload to update unassigned list
    await load();
    return matches.length;
  }, [projectId, keywords, load]);

  // Manually assign an entry to a phase
  const manualAssign = useCallback(async (entryId: string, phaseId: string) => {
    await updateEntryPhase(entryId, phaseId, 'manual');
    setUnassignedEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  // Learn from manual assignment — offer to save keyword
  const learnKeyword = useCallback(async (
    phaseId: string,
    keyword: string
  ) => {
    const created = await addKeyword(phaseId, keyword, 'learned_from_correction');
    setKeywords((prev) => [...prev, created]);
    return created;
  }, []);

  // Add a user-entered keyword
  const addUserKeyword = useCallback(async (phaseId: string, keyword: string) => {
    const created = await addKeyword(phaseId, keyword, 'user_entered');
    setKeywords((prev) => [...prev, created]);
    return created;
  }, []);

  // Remove keyword
  const removeKeyword = useCallback(async (id: string) => {
    await deleteKeyword(id);
    setKeywords((prev) => prev.filter((k) => k.id !== id));
  }, []);

  // Correct a wrong assignment — change phase, optionally update mapping
  const correctAssignment = useCallback(async (entryId: string, newPhaseId: string) => {
    await updateEntryPhase(entryId, newPhaseId, 'manual');
    await load();
  }, [load]);

  return {
    keywords,
    unassignedEntries,
    loading,
    error,
    runAutoAssign,
    manualAssign,
    learnKeyword,
    addUserKeyword,
    removeKeyword,
    correctAssignment,
    reload: load,
  };
}
