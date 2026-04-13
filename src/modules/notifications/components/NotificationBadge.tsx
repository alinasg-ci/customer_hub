'use client';

type NotificationBadgeProps = {
  readonly count: number;
  readonly onClick: () => void;
};

export function NotificationBadge({ count, onClick }: NotificationBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-[12px] p-1.5 text-oat-500 transition-colors hover:bg-oat-100 hover:text-charcoal-700"
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
    >
      <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-matcha-500 px-1 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
