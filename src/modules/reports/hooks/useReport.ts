'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchCachedEntries } from '@/modules/time-tracking';
import { fetchManualEntries, createManualEntry, deleteManualEntry } from '../api/reportsApi';
import type {
  ReportEntry,
  GroupBy,
  SortBy,
  SortDir,
  ReportFilter,
  GroupedEntries,
  CreateManualEntryInput,
} from '../types';
import type { Phase } from '@/modules/planning';

export function useReport(projectId: string, phases: readonly Phase[]) {
  const [allEntries, setAllEntries] = useState<readonly ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('phase');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filter, setFilter] = useState<ReportFilter>({});
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());

  const phaseMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of phases) {
      map.set(p.id, p.name);
    }
    return map;
  }, [phases]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cached, manual] = await Promise.all([
        fetchCachedEntries(projectId),
        fetchManualEntries(projectId),
      ]);

      const togglEntries: ReportEntry[] = cached.map((e) => ({
        id: e.id,
        source: 'toggl',
        date: e.start_time.split('T')[0],
        description: e.description ?? '',
        hours: e.duration_hours,
        billable: e.billable,
        phaseId: e.phase_id,
        phaseName: e.phase_id ? phaseMap.get(e.phase_id) ?? null : null,
      }));

      const manualEntries: ReportEntry[] = manual.map((e) => ({
        id: e.id,
        source: 'manual',
        date: e.date,
        description: e.description ?? '',
        hours: e.hours,
        billable: e.billable,
        phaseId: e.phase_id,
        phaseName: e.phase_id ? phaseMap.get(e.phase_id) ?? null : null,
      }));

      setAllEntries([...togglEntries, ...manualEntries]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [projectId, phaseMap]);

  useEffect(() => {
    load();
  }, [load]);

  // Filtered entries
  const filtered = useMemo(() => {
    return allEntries.filter((e) => {
      if (filter.dateFrom && e.date < filter.dateFrom) return false;
      if (filter.dateTo && e.date > filter.dateTo) return false;
      if (filter.phaseId && e.phaseId !== filter.phaseId) return false;
      if (filter.billable !== undefined && e.billable !== filter.billable) return false;
      return true;
    });
  }, [allEntries, filter]);

  // Sorted entries
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortBy === 'hours') cmp = a.hours - b.hours;
      else if (sortBy === 'description') cmp = a.description.localeCompare(b.description);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  // Grouped entries
  const grouped = useMemo((): readonly GroupedEntries[] => {
    const groups = new Map<string, ReportEntry[]>();

    for (const entry of sorted) {
      let key: string;
      if (groupBy === 'phase') key = entry.phaseName ?? 'Unassigned';
      else if (groupBy === 'date') key = entry.date;
      else if (groupBy === 'description') key = entry.description || 'No description';
      else key = entry.billable ? 'Billable' : 'Non-billable';

      const existing = groups.get(key) ?? [];
      groups.set(key, [...existing, entry]);
    }

    return Array.from(groups.entries()).map(([key, entries]) => ({
      groupKey: key,
      groupLabel: key,
      entries,
      totalHours: entries.reduce((sum, e) => sum + e.hours, 0),
    }));
  }, [sorted, groupBy]);

  // Totals (memoized)
  const totalHours = useMemo(() => filtered.reduce((sum, e) => sum + e.hours, 0), [filtered]);
  const billableHours = useMemo(() => filtered.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0), [filtered]);

  // Selected entries subtotal
  const selectedSubtotal = useMemo(() => {
    return filtered
      .filter((e) => selectedIds.has(e.id))
      .reduce((sum, e) => sum + e.hours, 0);
  }, [filtered, selectedIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Manual entry
  const addManualEntry = useCallback(async (input: CreateManualEntryInput) => {
    await createManualEntry(input);
    await load();
  }, [load]);

  const removeManualEntry = useCallback(async (id: string) => {
    await deleteManualEntry(id);
    setAllEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // CSV export
  const exportCsv = useCallback(() => {
    const header = 'Date,Description,Hours,Billable,Phase,Source\n';
    const rows = sorted.map((e) =>
      `"${e.date}","${e.description.replace(/"/g, '""')}",${e.hours.toFixed(2)},${e.billable ? 'Yes' : 'No'},"${e.phaseName ?? 'Unassigned'}","${e.source}"`
    ).join('\n');

    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${projectId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sorted, projectId]);

  return {
    entries: sorted,
    grouped,
    loading,
    error,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    filter,
    setFilter,
    totalHours,
    billableHours,
    selectedIds,
    selectedSubtotal,
    toggleSelect,
    clearSelection,
    addManualEntry,
    removeManualEntry,
    exportCsv,
    reload: load,
  };
}
