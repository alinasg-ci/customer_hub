'use client';

import { useCallback, useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePlanning } from '../hooks/usePlanning';
import { useTasks } from '../hooks/useTasks';
import { downloadCsv } from '@/shared/utils/downloadCsv';
import { formatHours } from '@/shared/utils/formatHours';
import { exportCustomerPlanningPng } from '../utils/exportPng';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn } from '@/shared/utils/cn';
import type { Phase, Task } from '../types';

type CustomerPlanningViewProps = {
  readonly projectId: string;
  readonly projectName: string;
};

export function CustomerPlanningView({ projectId, projectName }: CustomerPlanningViewProps) {
  const { phases, loading: phasesLoading, reorder: reorderPhases } = usePlanning(projectId);
  const { tasksByPhase, loading: tasksLoading, reorder: reorderTaskList } = useTasks(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter out internal tasks per phase
  const customerTasksByPhase = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const phase of phases) {
      const allTasks = tasksByPhase.get(phase.id) ?? [];
      const visible = allTasks.filter((t) => !t.internal_use);
      map.set(phase.id, visible);
    }
    return map;
  }, [phases, tasksByPhase]);

  // Grand total of visible task hours
  const grandTotal = useMemo(() => {
    let total = 0;
    for (const tasks of customerTasksByPhase.values()) {
      total += tasks.reduce((s, t) => s + t.planned_hours, 0);
    }
    return total;
  }, [customerTasksByPhase]);

  const handlePhaseDragEnd = useCallback((event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    if (event.over && event.active.id !== event.over.id) {
      reorderPhases(String(event.active.id), String(event.over.id));
    }
  }, [reorderPhases]);

  const handleExportCsv = useCallback(() => {
    const lines = ['Phase,Task,Planned Hours'];
    for (const phase of phases) {
      const tasks = customerTasksByPhase.get(phase.id) ?? [];
      const phaseTotal = tasks.reduce((s, t) => s + t.planned_hours, 0);
      lines.push(`${escapeCsvField(phase.name)},,${phaseTotal}`);
      for (const task of tasks) {
        lines.push(`${escapeCsvField(phase.name)},${escapeCsvField(task.name || 'Untitled')},${task.planned_hours}`);
      }
    }
    lines.push(`Total,,${grandTotal}`);
    downloadCsv(lines.join('\n'), `${projectName} - Customer Planning.csv`);
  }, [phases, customerTasksByPhase, grandTotal, projectName]);

  const handleExportPng = useCallback(() => {
    exportCustomerPlanningPng(projectName, phases, customerTasksByPhase);
  }, [projectName, phases, customerTasksByPhase]);

  if (phasesLoading || tasksLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (phases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-oat-300 py-16">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-oat-200">
          <svg className="h-6 w-6 text-charcoal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-black">No phases yet</h3>
        <p className="mt-1 text-sm text-charcoal-500">Create phases and tasks in My Planning first.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header with export buttons and total */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-charcoal-500">
          Total: <strong className="text-black">{formatHours(grandTotal)}</strong>
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-oat-300 px-3 py-1.5 text-sm text-charcoal-500 hover:bg-cream"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            CSV
          </button>
          <button
            onClick={handleExportPng}
            className="flex items-center gap-1.5 rounded-lg border border-oat-300 px-3 py-1.5 text-sm text-charcoal-500 hover:bg-cream"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            PNG
          </button>
        </div>
      </div>

      {/* Phase tables with DnD */}
      <div className="space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePhaseDragEnd}>
          <SortableContext items={phases.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {phases.map((phase) => (
              <SortableCustomerPhase
                key={phase.id}
                phase={phase}
                tasks={customerTasksByPhase.get(phase.id) ?? []}
                sensors={sensors}
                onReorderTasks={reorderTaskList}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

// ─── Sortable Phase ───────────────────────────────────────────────────────────

function SortableCustomerPhase({ phase, tasks, sensors, onReorderTasks }: {
  readonly phase: Phase;
  readonly tasks: readonly Task[];
  readonly sensors: ReturnType<typeof useSensors>;
  readonly onReorderTasks: (tasks: readonly { id: string; display_order: number }[]) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: phase.id });

  const phaseTotal = tasks.reduce((s, t) => s + t.planned_hours, 0);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTaskDragEnd = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    if (!event.over || event.active.id === event.over.id) return;
    const activeId = String(event.active.id);
    const overId = String(event.over.id);
    const oldIndex = tasks.findIndex((t) => t.id === activeId);
    const newIndex = tasks.findIndex((t) => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...tasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorderTasks(reordered.map((t, i) => ({ id: t.id, display_order: i })));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl border border-oat-300 bg-white shadow-sm overflow-hidden',
        isDragging && 'opacity-50'
      )}
    >
      {/* Phase header */}
      <div className="flex items-center justify-between bg-cream/80 px-4 py-3 border-b border-oat-200">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab rounded p-1 text-oat-500 hover:text-charcoal-500"
            aria-label="Drag to reorder phase"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-black">{phase.name}</span>
        </div>
        <span className="text-xs text-charcoal-500">{formatHours(phaseTotal)}</span>
      </div>

      {/* Task table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-oat-200 text-[11px] font-semibold uppercase tracking-widest text-charcoal-300">
            <th className="w-8 py-2 pl-4"></th>
            <th className="py-2 px-3 text-left">Task</th>
            <th className="py-2 px-3 text-right w-28">Planned hours</th>
          </tr>
        </thead>
        <tbody>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <SortableCustomerTask key={task.id} task={task} />
              ))}
            </SortableContext>
          </DndContext>
          {tasks.length === 0 && (
            <tr>
              <td colSpan={3} className="py-3 px-4 text-sm text-charcoal-300 italic text-center">
                No client-facing tasks in this phase
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sortable Task Row ────────────────────────────────────────────────────────

function SortableCustomerTask({ task }: { readonly task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-b border-cream hover:bg-cream',
        isDragging && 'opacity-50'
      )}
    >
      <td className="py-2 pl-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-0.5 text-oat-500 hover:text-charcoal-500"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
          </svg>
        </button>
      </td>
      <td className="py-2 px-3 text-black">
        {task.name || <span className="italic text-charcoal-300">Untitled</span>}
      </td>
      <td className="py-2 px-3 text-right text-charcoal-500">
        {formatHours(task.planned_hours)}
      </td>
    </tr>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
