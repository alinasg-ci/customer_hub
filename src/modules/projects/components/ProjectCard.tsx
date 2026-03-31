'use client';

import { cn } from '@/shared/utils/cn';
import type { Project } from '../types';

type ProjectCardProps = {
  readonly project: Project;
  readonly onStatusChange: (id: string, status: 'active' | 'pending' | 'closed') => void;
  readonly onDelete?: (id: string) => void;
  readonly onClick: (id: string) => void;
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-500',
};

const TYPE_LABELS: Record<string, string> = {
  project: 'Project',
  retainer: 'Retainer',
  hour_bank: 'Hour Bank',
};

const CURRENCY_SYMBOLS: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' };

export function ProjectCard({ project, onStatusChange, onDelete, onClick }: ProjectCardProps) {
  const isClosed = project.status === 'closed';

  function formatMoney(amount: number | null, currency: string): string {
    if (amount === null) return '-';
    const symbol = CURRENCY_SYMBOLS[currency] ?? '';
    return `${symbol}${amount.toLocaleString('en-IL', { minimumFractionDigits: 2 })}`;
  }

  return (
    <div
      className={cn(
        'group rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md cursor-pointer',
        isClosed && 'opacity-60'
      )}
      onClick={() => onClick(project.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(project.id);
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900">
              {project.name}
            </h3>
            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[project.status])}>
              {project.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">{TYPE_LABELS[project.type]}</p>
        </div>
        <div className="ml-3 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <select
            value={project.status}
            onChange={(e) => onStatusChange(project.id, e.target.value as 'active' | 'pending' | 'closed')}
            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
          {onDelete && (
            <button
              onClick={() => onDelete(project.id)}
              className="rounded p-2.5 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              aria-label={`Delete ${project.name}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {project.type === 'project' && (
          <>
            <div>
              <span className="text-gray-500">Fee: </span>
              <span className="font-medium">{formatMoney(project.total_fee, project.total_fee_currency)}</span>
            </div>
            <div>
              <span className="text-gray-500">Hours: </span>
              <span className="font-medium">{project.total_scoped_hours ?? '-'}</span>
            </div>
            {project.deadline && (
              <div className="col-span-2">
                <span className="text-gray-500">Deadline: </span>
                <span className="font-medium">{new Date(project.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </>
        )}

        {project.type === 'retainer' && (
          <>
            <div>
              <span className="text-gray-500">Fee: </span>
              <span className="font-medium">{formatMoney(project.retainer_fee, project.retainer_fee_currency)}</span>
            </div>
            <div>
              <span className="text-gray-500">Period: </span>
              <span className="font-medium capitalize">{project.billing_period ?? '-'}</span>
            </div>
          </>
        )}

        {project.type === 'hour_bank' && (
          <>
            <div>
              <span className="text-gray-500">Bank: </span>
              <span className="font-medium">{project.total_scoped_hours ?? '-'} hrs</span>
            </div>
            <div>
              <span className="text-gray-500">Cost: </span>
              <span className="font-medium">{formatMoney(project.total_fee, project.total_fee_currency)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
