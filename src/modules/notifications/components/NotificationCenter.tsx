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
        className="absolute right-4 top-14 w-96 max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          <button
            onClick={readAll}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Mark all read
          </button>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">Loading...</div>
        ) : error ? (
          <div className="px-4 py-6 text-center text-sm text-red-500">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">No notifications</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif.id, notif.link)}
                className={cn(
                  'w-full px-4 py-3 text-left transition-colors hover:bg-gray-50',
                  !notif.is_read && 'bg-blue-50'
                )}
              >
                <div className="flex items-start gap-2">
                  {!notif.is_read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-800">{notif.message}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
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
