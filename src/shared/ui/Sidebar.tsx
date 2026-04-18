'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/utils/cn';
import { NotificationBadge, NotificationCenter, useNotifications } from '@/modules/notifications';

type NavItem = {
  readonly label: string;
  readonly href: string;
  readonly glyph: string;
};

const navItems: readonly NavItem[] = [
  { label: 'Overview', href: '/overview', glyph: '◐' },
  { label: 'Clients', href: '/', glyph: '◆' },
  { label: 'Calendar', href: '/calendar', glyph: '⊞' },
  { label: 'Archive', href: '/archive', glyph: '▢' },
];

const bottomNavItems: readonly NavItem[] = [
  { label: 'Settings', href: '/settings', glyph: '⌘' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <aside className="flex h-screen w-[248px] flex-col border-r border-oat-300 bg-cream">
        {/* Brand — tilted CH mark */}
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-[12px] bg-black text-xs font-bold text-white"
              style={{ transform: 'rotate(-5deg)', boxShadow: '-4px 4px 0 #000' }}
            >
              CH
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-black">Client Hub</span>
          </div>
          <NotificationBadge
            count={unreadCount}
            onClick={() => setShowNotifications(true)}
          />
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-dashed border-oat-300" />

        {/* Main nav */}
        <nav className="flex-1 space-y-0.5 px-3 pt-4">
          <p className="clay-label mb-2 px-3">
            Workspace
          </p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-[12px] px-3 py-2 text-[13px] font-medium transition-all duration-200',
                isActive(item.href)
                  ? 'bg-black text-white'
                  : 'text-charcoal-500 hover:bg-oat-100 hover:text-black'
              )}
            >
              <span className="clay-mono w-4 text-center text-sm">{item.glyph}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="space-y-0.5 px-3 pb-4">
          <div className="mx-1 mb-3 border-t border-dashed border-oat-300" />
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-[12px] px-3 py-2 text-[13px] font-medium transition-all duration-200',
                isActive(item.href)
                  ? 'bg-black text-white'
                  : 'text-charcoal-500 hover:bg-oat-100 hover:text-black'
              )}
            >
              <span className="clay-mono w-4 text-center text-sm">{item.glyph}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </aside>

      {showNotifications && (
        <NotificationCenter onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
}
