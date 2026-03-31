'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchOrCreatePlanningTable } from '../api/tables';
import { fetchPlanningRows, createPlanningRow, updatePlanningRow, deletePlanningRow, reorderPlanningRows } from '../api/rows';
import { buildPlanningTree } from '../utils/buildTree';
import type { PlanningTable, PlanningRow, PlanningRowTree, CreatePlanningRowInput, UpdatePlanningRowInput } from '../types';

export function usePlanningTable(projectId: string, clientId: string) {
  const [table, setTable] = useState<PlanningTable | null>(null);
  const [rows, setRows] = useState<readonly PlanningRow[]>([]);
  const [tree, setTree] = useState<readonly PlanningRowTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tbl = await fetchOrCreatePlanningTable(projectId, clientId);
      setTable(tbl);
      const fetchedRows = await fetchPlanningRows(tbl.id);
      setRows(fetchedRows);
      setTree(buildPlanningTree(fetchedRows));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load planning table';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId, clientId]);

  useEffect(() => {
    load();
  }, [load]);

  // Rebuild tree whenever rows change
  useEffect(() => {
    setTree(buildPlanningTree(rows));
  }, [rows]);

  const addRow = useCallback(async (input: Omit<CreatePlanningRowInput, 'planning_table_id'>) => {
    if (!table) return;

    // Calculate next display_order among siblings
    const siblings = rows.filter((r) => r.parent_row_id === (input.parent_row_id ?? null));
    const maxOrder = siblings.reduce((max, r) => Math.max(max, r.display_order), -1);

    const created = await createPlanningRow({
      ...input,
      planning_table_id: table.id,
      display_order: maxOrder + 1,
    });

    setRows((prev) => [...prev, created]);
  }, [table, rows]);

  const editRow = useCallback(async (id: string, input: UpdatePlanningRowInput) => {
    // Optimistic update
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...input } as PlanningRow : r))
    );

    try {
      await updatePlanningRow(id, input);
    } catch {
      // Revert on error — reload from server
      if (table) {
        const freshRows = await fetchPlanningRows(table.id);
        setRows(freshRows);
      }
    }
  }, [table]);

  const editRowDebounced = useCallback((id: string, input: UpdatePlanningRowInput) => {
    // Optimistic update immediately
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...input } as PlanningRow : r))
    );

    // Debounce the server save
    const existing = debounceTimers.current.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      debounceTimers.current.delete(id);
      try {
        await updatePlanningRow(id, input);
      } catch {
        if (table) {
          const freshRows = await fetchPlanningRows(table.id);
          setRows(freshRows);
        }
      }
    }, 500);

    debounceTimers.current.set(id, timer);
  }, [table]);

  const removeRow = useCallback(async (id: string) => {
    // Optimistic: remove row and all descendants
    const idsToRemove = new Set<string>();
    function collectDescendants(parentId: string) {
      idsToRemove.add(parentId);
      for (const r of rows) {
        if (r.parent_row_id === parentId) {
          collectDescendants(r.id);
        }
      }
    }
    collectDescendants(id);

    setRows((prev) => prev.filter((r) => !idsToRemove.has(r.id)));

    try {
      await deletePlanningRow(id);
    } catch {
      if (table) {
        const freshRows = await fetchPlanningRows(table.id);
        setRows(freshRows);
      }
    }
  }, [rows, table]);

  const reorder = useCallback(async (reorderedRows: readonly { id: string; display_order: number }[]) => {
    // Optimistic update
    setRows((prev) => {
      const orderMap = new Map(reorderedRows.map((r) => [r.id, r.display_order]));
      return prev.map((r) => {
        const newOrder = orderMap.get(r.id);
        return newOrder !== undefined ? { ...r, display_order: newOrder } : r;
      });
    });

    try {
      await reorderPlanningRows(reorderedRows);
    } catch {
      if (table) {
        const freshRows = await fetchPlanningRows(table.id);
        setRows(freshRows);
      }
    }
  }, [table]);

  return {
    table,
    rows,
    tree,
    loading,
    error,
    addRow,
    editRow,
    editRowDebounced,
    removeRow,
    reorder,
    reload: load,
  };
}
