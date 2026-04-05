'use client';

import { PlanningRowEditor } from './PlanningRowEditor';
import { TimelineBar } from './TimelineBar';
import { ColorPicker } from '@/shared/ui/ColorPicker';
import type { PlanningRowTree, UpdatePlanningRowInput } from '../types';

type PlanningTableRowProps = {
  readonly row: PlanningRowTree;
  readonly parentColor: string | null;
  readonly onUpdate: (id: string, input: UpdatePlanningRowInput) => void;
  readonly onDelete: (id: string) => void;
  readonly onAddChild: (parentId: string | null, level: 1 | 2 | 3) => void;
  readonly onIndent: (id: string) => void;
  readonly onOutdent: (id: string) => void;
  readonly timelineStart: string | null;
  readonly timelineEnd: string | null;
};

const INDENT: Record<number, string> = {
  1: 'pl-0',
  2: 'pl-6',
  3: 'pl-12',
};

export function PlanningTableRow({
  row,
  parentColor,
  onUpdate,
  onDelete,
  onAddChild,
  onIndent,
  onOutdent,
  timelineStart,
  timelineEnd,
}: PlanningTableRowProps) {
  const effectiveColor = row.level === 1 ? row.color : parentColor;
  const canIndent = row.level < 3;
  const canOutdent = row.level > 1;
  const canAddChild = row.level < 3;

  return (
    <>
      <tr
        className="group border-b border-slate-100 hover:bg-slate-50"
        style={effectiveColor ? { borderLeftColor: effectiveColor, borderLeftWidth: '3px', borderLeftStyle: 'solid' } : undefined}
      >
        <td className={`py-2 pr-2 ${INDENT[row.level]}`}>
          <div className="flex items-center gap-1">
            {/* Indent/outdent buttons */}
            <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
              {canOutdent && (
                <button
                  onClick={() => onOutdent(row.id)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  aria-label="Outdent"
                  title="Outdent"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {canIndent && (
                <button
                  onClick={() => onIndent(row.id)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  aria-label="Indent"
                  title="Indent"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {row.level === 1 && (
              <ColorPicker
                value={row.color}
                onChange={(color) => onUpdate(row.id, { color })}
              />
            )}

            <PlanningRowEditor
              value={row.name}
              placeholder="Phase name"
              className={row.level === 1 ? 'font-semibold' : row.level === 3 ? 'text-xs text-slate-500' : ''}
              onSave={(name) => onUpdate(row.id, { name })}
            />

            {row.linked_phase_id && (
              <span className="ml-1 text-indigo-500" title="Linked to hours phase">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </span>
            )}
          </div>
        </td>

        <td className="py-2 px-2">
          <PlanningRowEditor
            value={row.content ?? ''}
            placeholder="Notes..."
            multiline
            className="text-sm text-slate-500"
            onSave={(content) => onUpdate(row.id, { content: content || null })}
          />
        </td>

        <td className="py-2 px-2">
          <input
            type="date"
            value={row.start_date ?? ''}
            onChange={(e) => onUpdate(row.id, { start_date: e.target.value || null })}
            className="w-28 rounded-lg border border-slate-200 px-1.5 py-1 text-xs text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
          />
        </td>

        <td className="py-2 px-2">
          <input
            type="date"
            value={row.end_date ?? ''}
            onChange={(e) => onUpdate(row.id, { end_date: e.target.value || null })}
            className="w-28 rounded-lg border border-slate-200 px-1.5 py-1 text-xs text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
          />
        </td>

        <td className="py-2 px-2 w-32">
          {timelineStart && timelineEnd && (
            <TimelineBar
              startDate={row.start_date}
              endDate={row.end_date}
              color={effectiveColor}
              timelineStart={timelineStart}
              timelineEnd={timelineEnd}
            />
          )}
        </td>

        <td className="py-2 px-2">
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {canAddChild && (
              <button
                onClick={() => onAddChild(row.id, (row.level + 1) as 1 | 2 | 3)}
                className="rounded-lg p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                aria-label="Add sub-item"
                title="Add sub-item"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            <button
              onClick={() => onDelete(row.id)}
              className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Delete row"
              title="Delete"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {/* Render children recursively */}
      {row.children.map((child) => (
        <PlanningTableRow
          key={child.id}
          row={child}
          parentColor={effectiveColor}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onIndent={onIndent}
          onOutdent={onOutdent}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
        />
      ))}
    </>
  );
}
