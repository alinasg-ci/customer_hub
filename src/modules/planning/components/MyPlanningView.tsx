'use client';

import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePlanning } from '../hooks/usePlanning';
import { useTasks } from '../hooks/useTasks';
import { useTimeEntries } from '@/modules/time-tracking';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn } from '@/shared/utils/cn';
import { formatHours } from '@/shared/utils/formatHours';
import type { Phase, Task, UpdateTaskInput } from '../types';

type MyPlanningViewProps = {
  readonly projectId: string;
  readonly onDataChanged?: () => void;
};

export function MyPlanningView({ projectId, onDataChanged }: MyPlanningViewProps) {
  const {
    phases, loading: phasesLoading, add: addPhase, remove: removePhase,
    debouncedUpdate: updatePhase, reorder: reorderPhases,
  } = usePlanning(projectId);
  const {
    tasksByPhase, loading: tasksLoading, addTask, editTask, removeTask, reorder: reorderTaskList,
  } = useTasks(projectId);
  const { entries } = useTimeEntries(projectId);

  const [deletingPhaseId, setDeletingPhaseId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Build hours-done-by-task map from time entries
  const hoursByTask = new Map<string, number>();
  for (const e of entries) {
    if (e.taskId) {
      hoursByTask.set(e.taskId, (hoursByTask.get(e.taskId) ?? 0) + e.durationHours);
    }
  }

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const notifyChange = useCallback(() => {
    onDataChanged?.();
  }, [onDataChanged]);

  const handleDeletePhase = useCallback(async () => {
    if (!deletingPhaseId) return;
    setDeleteLoading(true);
    try {
      await removePhase(deletingPhaseId);
      setDeletingPhaseId(null);
      notifyChange();
    } catch {
      // handled by hook
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingPhaseId, removePhase, notifyChange]);

  const handleAddPhase = useCallback(async () => {
    await addPhase({ project_id: projectId, name: 'New Phase' });
    notifyChange();
  }, [addPhase, projectId, notifyChange]);

  const handlePhaseDragEnd = useCallback((event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    if (event.over && event.active.id !== event.over.id) {
      reorderPhases(String(event.active.id), String(event.over.id));
    }
  }, [reorderPhases]);

  if (phasesLoading || tasksLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (phases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
          <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-900">No phases yet</h3>
        <p className="mt-1 text-sm text-slate-500">Create your first phase to start planning tasks.</p>
        <button
          onClick={handleAddPhase}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add Phase
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePhaseDragEnd}>
        <SortableContext items={phases.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          {phases.map((phase) => (
            <SortablePhaseTable
              key={phase.id}
              phase={phase}
              tasks={tasksByPhase.get(phase.id) ?? []}
              hoursByTask={hoursByTask}
              projectId={projectId}
              onUpdatePhase={updatePhase}
              onDeletePhase={() => setDeletingPhaseId(phase.id)}
              onAddTask={async (input) => { const t = await addTask(input); notifyChange(); return t; }}
              onEditTask={async (id, input) => { await editTask(id, input); notifyChange(); }}
              onRemoveTask={async (id) => { await removeTask(id); notifyChange(); }}
              onReorderTasks={reorderTaskList}
              sensors={sensors}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        onClick={handleAddPhase}
        className="rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700 w-full"
      >
        + Add Phase
      </button>

      <ConfirmDeleteDialog
        open={deletingPhaseId !== null}
        title="Delete phase"
        message="Permanently delete this phase and all its tasks? This cannot be undone."
        onConfirm={handleDeletePhase}
        onCancel={() => setDeletingPhaseId(null)}
        loading={deleteLoading}
      />
    </div>
  );
}

// ─── Sortable Phase Table ─────────────────────────────────────────────────────

function SortablePhaseTable({ phase, tasks, hoursByTask, projectId, onUpdatePhase, onDeletePhase, onAddTask, onEditTask, onRemoveTask, onReorderTasks, sensors }: {
  readonly phase: Phase;
  readonly tasks: readonly Task[];
  readonly hoursByTask: Map<string, number>;
  readonly projectId: string;
  readonly onUpdatePhase: (id: string, input: { name?: string }) => void;
  readonly onDeletePhase: () => void;
  readonly onAddTask: (input: { phase_id: string; project_id: string; name: string }) => Promise<Task>;
  readonly onEditTask: (id: string, input: UpdateTaskInput) => Promise<void>;
  readonly onRemoveTask: (id: string) => Promise<void>;
  readonly onReorderTasks: (tasks: readonly { id: string; display_order: number }[]) => Promise<void>;
  readonly sensors: ReturnType<typeof useSensors>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: phase.id });
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(phase.name);

  const totalPlanned = tasks.reduce((s, t) => s + t.planned_hours, 0);
  const totalDone = tasks.reduce((s, t) => s + (hoursByTask.get(t.id) ?? 0), 0);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleNameBlur = () => {
    setEditingName(false);
    if (nameValue.trim() && nameValue.trim() !== phase.name) {
      onUpdatePhase(phase.id, { name: nameValue.trim() });
    } else {
      setNameValue(phase.name);
    }
  };

  const handleAddTask = async () => {
    await onAddTask({ phase_id: phase.id, project_id: projectId, name: '' });
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
        'rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden',
        isDragging && 'opacity-50'
      )}
    >
      {/* Phase header */}
      <div className="group flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab rounded p-1 text-slate-300 opacity-0 transition-opacity hover:text-slate-500 group-hover:opacity-100"
            aria-label="Drag to reorder phase"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
            </svg>
          </button>

          {editingName ? (
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); if (e.key === 'Escape') { setNameValue(phase.name); setEditingName(false); } }}
              autoFocus
              className="rounded-lg border border-indigo-300 px-2 py-0.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
            >
              {phase.name}
            </button>
          )}

          <span className="text-xs text-slate-400">
            {formatHours(totalPlanned)} planned · {formatHours(totalDone)} done
          </span>
        </div>

        <button
          onClick={onDeletePhase}
          className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
          aria-label="Delete phase"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      {/* Task table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            <th className="w-8 py-2 pl-4"></th>
            <th className="py-2 px-3 text-left">Task</th>
            <th className="py-2 px-3 text-right w-28">Planned</th>
            <th className="py-2 px-3 text-center w-24">Internal</th>
            <th className="py-2 px-3 text-right w-28">Done</th>
            <th className="py-2 px-3 text-center w-28">Due date</th>
            <th className="py-2 pr-4 w-10"></th>
          </tr>
        </thead>
        <tbody>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
            <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map((task) => (
                <SortableTaskRow
                  key={task.id}
                  task={task}
                  hoursDone={hoursByTask.get(task.id) ?? 0}
                  onEdit={onEditTask}
                  onRemove={onRemoveTask}
                />
              ))}
            </SortableContext>
          </DndContext>
        </tbody>
      </table>

      {/* Add task row */}
      <button
        onClick={handleAddTask}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add task
      </button>
    </div>
  );
}

// ─── Sortable Task Row ────────────────────────────────────────────────────────

function SortableTaskRow({ task, hoursDone, onEdit, onRemove }: {
  readonly task: Task;
  readonly hoursDone: number;
  readonly onEdit: (id: string, input: UpdateTaskInput) => Promise<void>;
  readonly onRemove: (id: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const [editingName, setEditingName] = useState(!task.name);
  const [nameValue, setNameValue] = useState(task.name);

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date ? task.due_date < today : false;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleNameBlur = () => {
    setEditingName(false);
    if (nameValue.trim() !== task.name) {
      onEdit(task.id, { name: nameValue.trim() });
    }
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'group border-b border-slate-50 hover:bg-slate-50',
        isDragging && 'opacity-50'
      )}
    >
      {/* Drag handle */}
      <td className="py-2 pl-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-0.5 text-slate-300 opacity-0 transition-opacity hover:text-slate-500 group-hover:opacity-100"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
          </svg>
        </button>
      </td>

      {/* Task name */}
      <td className="py-2 px-3">
        {editingName ? (
          <input
            type="text"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
            autoFocus
            placeholder="Task name..."
            className="w-full rounded border border-indigo-300 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400/20"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-left text-sm text-slate-800 hover:text-indigo-600"
          >
            {task.name || <span className="italic text-slate-400">Untitled</span>}
          </button>
        )}
      </td>

      {/* Planned hours */}
      <td className="py-2 px-3 text-right">
        <input
          type="number"
          step="0.5"
          min="0"
          value={task.planned_hours}
          onChange={(e) => onEdit(task.id, { planned_hours: parseFloat(e.target.value) || 0 })}
          className="w-16 rounded border border-transparent px-1.5 py-0.5 text-right text-sm text-slate-700 hover:border-slate-200 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-400/20"
        />
      </td>

      {/* Internal use */}
      <td className="py-2 px-3 text-center">
        <input
          type="checkbox"
          checked={task.internal_use}
          onChange={(e) => onEdit(task.id, { internal_use: e.target.checked })}
          className="rounded border-slate-300"
        />
      </td>

      {/* Hours done */}
      <td className="py-2 px-3 text-right">
        <span className={cn(
          'text-sm font-medium',
          hoursDone > task.planned_hours && task.planned_hours > 0 ? 'text-red-600' : 'text-slate-700'
        )}>
          {hoursDone > 0 ? formatHours(hoursDone) : '—'}
        </span>
      </td>

      {/* Due date */}
      <td className="py-2 px-3 text-center">
        <input
          type="date"
          value={task.due_date ?? ''}
          onChange={(e) => onEdit(task.id, { due_date: e.target.value || null })}
          className={cn(
            'rounded border border-transparent px-1.5 py-0.5 text-xs hover:border-slate-200 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-400/20',
            isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
          )}
        />
      </td>

      {/* Delete */}
      <td className="py-2 pr-4">
        <button
          onClick={() => onRemove(task.id)}
          className="rounded-lg p-1 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
          aria-label="Delete task"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </td>
    </tr>
  );
}
