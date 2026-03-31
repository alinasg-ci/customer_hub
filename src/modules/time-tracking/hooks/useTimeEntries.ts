'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTimeEntries, syncTime } from '../adapter';
import type { TimeEntry } from '../types';

export function useTimeEntries(projectId: string) {
  const [entries, setEntries] = useState<readonly TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ synced: number; total: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTimeEntries(projectId);
      setEntries(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load time entries';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await syncTime();
      setSyncResult(result);
      await load(); // Reload entries after sync
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
    } finally {
      setSyncing(false);
    }
  }, [load]);

  const totalHours = entries.reduce((sum, e) => sum + e.durationHours, 0);
  const billableHours = entries.filter((e) => e.billable).reduce((sum, e) => sum + e.durationHours, 0);
  const nonBillableHours = totalHours - billableHours;

  return {
    entries,
    loading,
    syncing,
    error,
    syncResult,
    totalHours,
    billableHours,
    nonBillableHours,
    sync,
    reload: load,
  };
}
