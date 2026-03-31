'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPhases, createPhase, updatePhase, deletePhase, reorderPhases } from '../api/planningApi';
import type { Phase, CreatePhaseInput, UpdatePhaseInput, ComparisonRow } from '../types';

export function usePlanning(projectId: string) {
  const [phases, setPhases] = useState<readonly Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPhases(projectId);
      setPhases(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load phases';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced auto-save for inline edits
  const debouncedUpdate = useCallback((id: string, input: UpdatePhaseInput) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    // Optimistic update
    setPhases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...input } : p))
    );

    saveTimerRef.current = setTimeout(async () => {
      try {
        await updatePhase(id, input);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to save';
        setError(message);
        await load(); // Revert on error
      }
    }, 500);
  }, [load]);

  const add = useCallback(async (input: CreatePhaseInput) => {
    let maxOrder = -1;
    setPhases((prev) => {
      maxOrder = prev.length > 0 ? Math.max(...prev.map((p) => p.display_order)) : -1;
      return prev;
    });

    const created = await createPhase({
      ...input,
      display_order: input.display_order ?? maxOrder + 1,
    });
    setPhases((prev) => [...prev, created]);
    return created;
  }, []);

  const addAtPosition = useCallback(async (input: CreatePhaseInput, position: number) => {
    // Shift existing phases after the insertion point
    const reordered = phases.map((p) => ({
      ...p,
      display_order: p.display_order >= position ? p.display_order + 1 : p.display_order,
    }));

    const created = await createPhase({
      ...input,
      display_order: position,
    });

    // Save reordered positions
    const toUpdate = reordered
      .filter((p, i) => p.display_order !== phases[i].display_order)
      .map(({ id, display_order }) => ({ id, display_order }));

    if (toUpdate.length > 0) {
      await reorderPhases(toUpdate);
    }

    setPhases([...reordered, created].sort((a, b) => a.display_order - b.display_order));
    return created;
  }, [phases]);

  const remove = useCallback(async (id: string) => {
    await deletePhase(id);
    setPhases((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const reorder = useCallback(async (activeId: string, overId: string) => {
    const oldIndex = phases.findIndex((p) => p.id === activeId);
    const newIndex = phases.findIndex((p) => p.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    // Reorder array
    const reordered = [...phases];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Assign new display_order values
    const withNewOrder = reordered.map((p, i) => ({ ...p, display_order: i }));
    setPhases(withNewOrder);

    // Persist
    try {
      await reorderPhases(withNewOrder.map(({ id, display_order }) => ({ id, display_order })));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reorder';
      setError(message);
      await load();
    }
  }, [phases, load]);

  // Computed totals
  const totalQuotedHours = phases.reduce((sum, p) => sum + p.quoted_hours, 0);
  const totalInternalHours = phases.reduce((sum, p) => sum + p.internal_planned_hours, 0);

  const comparisonRows: readonly ComparisonRow[] = phases.map((phase) => ({
    phase,
    quotedHours: phase.quoted_hours,
    internalHours: phase.internal_planned_hours,
    delta: phase.internal_planned_hours - phase.quoted_hours,
    overBudget: phase.internal_planned_hours > phase.quoted_hours,
  }));

  return {
    phases,
    loading,
    error,
    add,
    addAtPosition,
    remove,
    reorder,
    debouncedUpdate,
    totalQuotedHours,
    totalInternalHours,
    comparisonRows,
    reload: load,
  };
}
