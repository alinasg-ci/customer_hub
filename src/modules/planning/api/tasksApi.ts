import { supabase } from '@/shared/hooks/useSupabase';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';

export async function fetchTasksByProject(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data as Task[];
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      phase_id: input.phase_id,
      project_id: input.project_id,
      name: input.name,
      planned_hours: input.planned_hours ?? 0,
      internal_use: input.internal_use ?? false,
      due_date: input.due_date ?? null,
      display_order: input.display_order ?? 0,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function reorderTasks(tasks: readonly { id: string; display_order: number }[]): Promise<void> {
  for (const task of tasks) {
    const { error } = await supabase
      .from('tasks')
      .update({ display_order: task.display_order })
      .eq('id', task.id);

    if (error) throw error;
  }
}
