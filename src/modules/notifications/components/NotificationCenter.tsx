'use client';

import { useRouter } from 'next/navigation';
import { useNotifications } from '../hooks/useNotifications';
import { cn } from '@/shared/utils/cn';

type NotificationCenterProps = {
  readonly onClose: () => void;
};

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const { notifications, loading, error, read, readAll } = useNotifications();
  const router = useRouter();

  function handleClick(notificationId: string, link: string) {
    read(notificationId);
    router.push(link);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute left-[240px] top-0 w-[380px] max-h-screen overflow-y-auto border-r border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          <button
            onClick={readAll}
            className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800"
          >
            Mark all read
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Loading...</div>
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-red-500">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">All caught up</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif.id, notif.link)}
                className={cn(
                  'w-full px-5 py-3.5 text-left transition-colors hover:bg-slate-50',
                  !notif.is_read && 'bg-indigo-50/50'
                )}
              >
                <div className="flex items-start gap-2.5">
                  {!notif.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug text-slate-800">{notif.message}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(notif.created_at).toLocaleDateString('en-IL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
