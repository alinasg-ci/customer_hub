'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils/cn';
import { NotificationBadge, NotificationCenter, useNotifications } from '@/modules/notifications';

type NavItem = {
  readonly label: string;
  readonly href: string;
  readonly icon: string;
};

const navItems: readonly NavItem[] = [
  { label: 'Clients', href: '/', icon: '👤' },
  { label: 'Archive', href: '/archive', icon: '📦' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
          <h1 className="text-lg font-bold text-gray-900">Client Hub</h1>
          <NotificationBadge
            count={unreadCount}
            onClick={() => setShowNotifications(true)}
          />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {showNotifications && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
}
