'use client';

import { cn } from '@/shared/utils/cn';
import type { Client } from '../types';

type ClientCardProps = {
  readonly client: Client;
  readonly onEdit: (client: Client) => void;
  readonly onArchive: (id: string) => void;
  readonly onReactivate?: (id: string) => void;
  readonly onDelete?: (id: string) => void;
  readonly onClick: (id: string) => void;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  'bg-matcha-600',
  'bg-ube-800',
  'bg-slushie-800',
  'bg-lemon-700',
  'bg-pomegranate-400',
  'bg-blueberry-800',
  'bg-dragonfruit-500',
  'bg-charcoal-500',
] as const;

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ClientCard({ client, onEdit, onArchive, onReactivate, onDelete, onClick }: ClientCardProps) {
  const isArchived = client.status === 'archived';

  return (
    <div
      className={cn(
        'clay-card-sm group relative p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-clay-lg)] cursor-pointer',
        isArchived && 'opacity-60'
      )}
      onClick={() => onClick(client.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(client.id);
        }
      }}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-sm font-semibold text-white',
          getAvatarColor(client.name)
        )}>
          {getInitials(client.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-black">
            {client.name}
          </h3>
          {client.company && (
            <p className="mt-0.5 truncate text-sm text-charcoal-500">
              {client.company}
            </p>
          )}
        </div>
        <div
          className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(client)}
            className="rounded-[12px] p-2 text-oat-500 transition-colors hover:bg-oat-100 hover:text-charcoal-700"
            aria-label={`Edit ${client.name}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          {isArchived && onReactivate ? (
            <button
              onClick={() => onReactivate(client.id)}
              className="rounded-[12px] p-2 text-matcha-500 transition-colors hover:bg-matcha-300/20 hover:text-matcha-800"
              aria-label={`Reactivate ${client.name}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => onArchive(client.id)}
              className="rounded-[12px] p-2 text-oat-500 transition-colors hover:bg-lemon-400/20 hover:text-lemon-800"
              aria-label={`Archive ${client.name}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(client.id)}
              className="rounded-[12px] p-2 text-oat-500 transition-colors hover:bg-pomegranate-400/10 hover:text-pomegranate-600"
              aria-label={`Delete ${client.name}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
