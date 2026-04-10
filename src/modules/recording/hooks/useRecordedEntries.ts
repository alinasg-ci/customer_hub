'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchManualEntries, createManualEntry, updateManualEntry, deleteManualEntry } from '@/modules/reports/api/reportsApi';
import type { ManualTimeEntry, CreateManualEntryInput, UpdateManualEntryInput } from '@/modules/reports/types';

export function useRecordedEntries(projectId: string) {
  const [entries, setEntries] = useState<readonly ManualTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchManualEntries(projectId);
      setEntries(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load entries';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const billableHours = entries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0);

  const addEntry = useCallback(async (input: CreateManualEntryInput) => {
    const created = await createManualEntry(input);
    setEntries((prev) => [created, ...prev]);
  }, []);

  const editEntry = useCallback(async (id: string, input: UpdateManualEntryInput) => {
    const updated = await updateManualEntry(id, input);
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    await deleteManualEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    entries,
    loading,
    error,
    totalHours,
    billableHours,
    addEntry,
    editEntry,
    removeEntry,
    reload: load,
  };
}
