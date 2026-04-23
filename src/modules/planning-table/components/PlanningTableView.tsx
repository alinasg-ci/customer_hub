'use client';

import { useCallback, useMemo } from 'react';
import { usePlanningTable } from '../hooks/usePlanningTable';
import { PlanningTableRow } from './PlanningTableRow';
import { ExportButton } from './ExportButton';
import { getTimelineRange } from './TimelineBar';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { UpdatePlanningRowInput } from '../types';

type PlanningTableViewProps = {
  readonly projectId: string;
  readonly clientId: string;
};

export function PlanningTableView({ projectId, clientId }: PlanningTableViewProps) {
  const {
    tree,
    rows,
    loading,
    error,
    addRow,
    editRowDebounced,
    removeRow,
  } = usePlanningTable(projectId, clientId);

  const handleUpdate = useCallback((id: string, input: UpdatePlanningRowInput) => {
    editRowDebounced(id, input);
  }, [editRowDebounced]);

  const handleDelete = useCallback((id: string) => {
    removeRow(id);
  }, [removeRow]);

  const handleAddChild = useCallback((parentId: string | null, level: 1 | 2 | 3) => {
    addRow({
      parent_row_id: parentId ?? undefined,
      level,
      name: '',
    });
  }, [addRow]);

  const timelineRange = useMemo(() => getTimelineRange(rows), [rows]);

  const handleIndent = useCallback((id: string) => {
    // Find the row and the previous sibling at the same level
    const row = rows.find((r) => r.id === id);
    if (!row || row.level >= 3) return;

    // Find the previous sibling (same parent, lower display_order)
    const siblings = rows
      .filter((r) => r.parent_row_id === row.parent_row_id && r.id !== id)
      .sort((a, b) => a.display_order - b.display_order);

    const rowIndex = siblings.findIndex((s) => s.display_order > row.display_order);
    const previousSibling = rowIndex > 0 ? siblings[rowIndex - 1] : siblings[siblings.length - 1];

    if (!previousSibling || previousSibling.display_order >= row.display_order) {
      // Find any sibling before this row
      const before = siblings.filter((s) => s.display_order < row.display_order);
      const newParent = before[before.length - 1];
      if (!newParent) return;

      editRowDebounced(id, {
        parent_row_id: newParent.id,
        level: (row.level + 1) as 1 | 2 | 3,
      });
    } else {
      editRowDebounced(id, {
        parent_row_id: previousSibling.id,
        level: (row.level + 1) as 1 | 2 | 3,
      });
    }
  }, [rows, editRowDebounced]);

  const handleOutdent = useCallback((id: string) => {
    const row = rows.find((r) => r.id === id);
    if (!row || row.level <= 1 || !row.parent_row_id) return;

    const parent = rows.find((r) => r.id === row.parent_row_id);
    if (!parent) return;

    editRowDebounced(id, {
      parent_row_id: parent.parent_row_id,
      level: (row.level - 1) as 1 | 2 | 3,
    });
  }, [rows, editRowDebounced]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-pomegranate-400 bg-pomegranate-300/20 p-4">
        <p className="text-sm text-pomegranate-600">{error}</p>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-oat-500 p-8 text-center">
        <p className="text-sm text-charcoal-500">No planning rows yet.</p>
        <button
          onClick={() => handleAddChild(null, 1)}
          className="mt-3 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-900"
        >
          + Add first phase
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-oat-300 text-left text-xs font-medium uppercase tracking-wide text-charcoal-500">
            <th className="py-2 pr-2">Name</th>
            <th className="py-2 px-2">Content</th>
            <th className="py-2 px-2">Start</th>
            <th className="py-2 px-2">End</th>
            <th className="w-32 py-2 px-2">Timeline</th>
            <th className="w-20 py-2 px-2"></th>
          </tr>
        </thead>
        <tbody>
          {tree.map((row) => (
            <PlanningTableRow
              key={row.id}
              row={row}
              parentColor={null}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onAddChild={handleAddChild}
              onIndent={handleIndent}
              onOutdent={handleOutdent}
              timelineStart={timelineRange?.start ?? null}
              timelineEnd={timelineRange?.end ?? null}
            />
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => handleAddChild(null, 1)}
          className="rounded-lg border border-oat-300 px-3 py-1.5 text-sm text-charcoal-500 hover:bg-cream"
        >
          + Add phase
        </button>
        <ExportButton rows={rows} tableName="Project Plan" />
      </div>
    </div>
  );
}
