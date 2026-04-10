'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchTasksByProject, createTask, updateTask, deleteTask, reorderTasks } from '../api/tasksApi';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';

export function useTasks(projectId: string) {
  const [tasks, setTasks] = useState<readonly Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasksByProject(projectId);
      setTasks(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const tasksByPhase = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const list = map.get(task.phase_id) ?? [];
      list.push(task);
      map.set(task.phase_id, list);
    }
    // Sort each group by display_order
    for (const list of map.values()) {
      list.sort((a, b) => a.display_order - b.display_order);
    }
    return map;
  }, [tasks]);

  const addTask = useCallback(async (input: Omit<CreateTaskInput, 'display_order'>) => {
    const siblings = tasks.filter((t) => t.phase_id === input.phase_id);
    const maxOrder = siblings.reduce((max, t) => Math.max(max, t.display_order), -1);

    const created = await createTask({
      ...input,
      display_order: maxOrder + 1,
    });
    setTasks((prev) => [...prev, created]);
    return created;
  }, [tasks]);

  const editTask = useCallback(async (id: string, input: UpdateTaskInput) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...input } as Task : t))
    );
    try {
      await updateTask(id, input);
    } catch {
      await load();
    }
  }, [load]);

  const removeTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTask(id);
    } catch {
      await load();
    }
  }, [load]);

  const reorder = useCallback(async (reordered: readonly { id: string; display_order: number }[]) => {
    // Optimistic update
    setTasks((prev) => {
      const orderMap = new Map(reordered.map((r) => [r.id, r.display_order]));
      return prev.map((t) => {
        const newOrder = orderMap.get(t.id);
        return newOrder !== undefined ? { ...t, display_order: newOrder } : t;
      });
    });
    try {
      await reorderTasks(reordered);
    } catch {
      await load();
    }
  }, [load]);

  return {
    tasks,
    tasksByPhase,
    loading,
    error,
    addTask,
    editTask,
    removeTask,
    reorder,
    reload: load,
  };
}
