'use client';

import { cn } from '@/shared/utils/cn';
import type { Client } from '../types';

type ClientCardProps = {
  readonly client: Client;
  readonly onEdit: (client: Client) => void;
  readonly onArchive: (id: string) => void;
  readonly onReactivate?: (id: string) => void;
  readonly onClick: (id: string) => void;
};

export function ClientCard({ client, onEdit, onArchive, onReactivate, onClick }: ClientCardProps) {
  const isArchived = client.status === 'archived';

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer',
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
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-gray-900">
            {client.name}
          </h3>
          {client.company && (
            <p className="mt-0.5 truncate text-sm text-gray-500">
              {client.company}
            </p>
          )}
        </div>
        <div
          className="ml-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(client)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={`Edit ${client.name}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {isArchived && onReactivate ? (
            <button
              onClick={() => onReactivate(client.id)}
              className="rounded p-1.5 text-green-500 hover:bg-green-50 hover:text-green-700"
              aria-label={`Reactivate ${client.name}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => onArchive(client.id)}
              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
              aria-label={`Archive ${client.name}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
