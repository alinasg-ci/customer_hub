import { supabase } from '@/shared/hooks/useSupabase';
import type { Notification, CreateNotificationInput } from '../types';

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Notification[];
}

export async function fetchUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) throw error;
  return count ?? 0;
}

export async function fetchNotificationsByProject(projectId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Notification[];
}

export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      type: input.type,
      project_id: input.project_id,
      phase_id: input.phase_id ?? null,
      sub_project_id: input.sub_project_id ?? null,
      message: input.message,
      threshold_percent: input.threshold_percent,
      link: input.link,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}

export async function markAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function markAllAsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
}
