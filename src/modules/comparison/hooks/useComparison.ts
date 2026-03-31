'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchPhaseLinks, createPhaseLink, updatePhaseLink, deletePhaseLink } from '../api/phase-links';
import { buildComparisonRows, buildComparisonSummary, autoGeneratePhaseLinks } from '../utils/calculations';
import type { PhaseLink, ComparisonRowData, ComparisonSummary, CreatePhaseLinkInput, UpdatePhaseLinkInput } from '../types';
import type { Phase } from '@/modules/planning/types';
import type { TimeEntry } from '@/modules/time-tracking/types';

export function useComparison(
  projectId: string,
  phases: readonly Phase[],
  timeEntries: readonly TimeEntry[]
) {
  const [phaseLinks, setPhaseLinks] = useState<readonly PhaseLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const links = await fetchPhaseLinks(projectId);
      setPhaseLinks(links);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load phase links';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Build actual hours map from time entries
  const actualHoursByPhase = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of timeEntries) {
      if (entry.phaseId) {
        const current = map.get(entry.phaseId) ?? 0;
        map.set(entry.phaseId, current + entry.durationHours);
      }
    }
    return map;
  }, [timeEntries]);

  const rows: readonly ComparisonRowData[] = useMemo(
    () => buildComparisonRows(phaseLinks, phases, actualHoursByPhase),
    [phaseLinks, phases, actualHoursByPhase]
  );

  const summary: ComparisonSummary = useMemo(
    () => buildComparisonSummary(rows),
    [rows]
  );

  const addLink = useCallback(async (input: Omit<CreatePhaseLinkInput, 'project_id'>) => {
    const created = await createPhaseLink({ ...input, project_id: projectId });
    setPhaseLinks((prev) => [...prev, created]);
  }, [projectId]);

  const editLink = useCallback(async (id: string, input: UpdatePhaseLinkInput) => {
    const updated = await updatePhaseLink(id, input);
    setPhaseLinks((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }, []);

  const removeLink = useCallback(async (id: string) => {
    await deletePhaseLink(id);
    setPhaseLinks((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const autoGenerate = useCallback(async () => {
    const linksToCreate = autoGeneratePhaseLinks(phases, projectId);
    const created: PhaseLink[] = [];
    for (const link of linksToCreate) {
      const pl = await createPhaseLink({
        project_id: projectId,
        canonical_name: link.canonical_name,
        budget_phase_id: link.budget_phase_id ?? undefined,
        plan_phase_id: link.plan_phase_id ?? undefined,
      });
      created.push(pl);
    }
    setPhaseLinks((prev) => [...prev, ...created]);
  }, [phases, projectId]);

  return {
    phaseLinks,
    rows,
    summary,
    loading,
    error,
    addLink,
    editLink,
    removeLink,
    autoGenerate,
    reload: load,
  };
}
