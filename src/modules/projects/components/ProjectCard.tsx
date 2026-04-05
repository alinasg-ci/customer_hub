'use client';

import { cn } from '@/shared/utils/cn';
import type { Project } from '../types';

type ProjectCardProps = {
  readonly project: Project;
  readonly onStatusChange: (id: string, status: 'active' | 'pending' | 'closed') => void;
  readonly onDelete?: (id: string) => void;
  readonly onClick: (id: string) => void;
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
};

const TYPE_LABELS: Record<string, string> = {
  project: 'Project',
  retainer: 'Retainer',
  hour_bank: 'Hour Bank',
};

const CURRENCY_SYMBOLS: Record<string, string> = { ILS: '\u20AA', USD: '$', EUR: '\u20AC' };

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
        'group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer',
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
            <h3 className="truncate text-[15px] font-semibold text-slate-900">
              {project.name}
            </h3>
            <span className={cn('inline-flex shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-medium', STATUS_STYLES[project.status])}>
              {project.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{TYPE_LABELS[project.type]}</p>
        </div>
        <div className="ml-3 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <select
            value={project.status}
            onChange={(e) => onStatusChange(project.id, e.target.value as 'active' | 'pending' | 'closed')}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
          {onDelete && (
            <button
              onClick={() => onDelete(project.id)}
              className="rounded-lg p-2 text-slate-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              aria-label={`Delete ${project.name}`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {project.type === 'project' && (
          <>
            <div>
              <span className="text-slate-400 text-xs">Fee</span>
              <p className="font-medium text-slate-800">{formatMoney(project.total_fee, project.total_fee_currency)}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">Hours</span>
              <p className="font-medium text-slate-800">{project.total_scoped_hours ?? '-'}</p>
            </div>
            {project.deadline && (
              <div className="col-span-2">
                <span className="text-slate-400 text-xs">Deadline</span>
                <p className="font-medium text-slate-800">{new Date(project.deadline).toLocaleDateString()}</p>
              </div>
            )}
          </>
        )}

        {project.type === 'retainer' && (
          <>
            <div>
              <span className="text-slate-400 text-xs">Fee</span>
              <p className="font-medium text-slate-800">{formatMoney(project.retainer_fee, project.retainer_fee_currency)}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">Period</span>
              <p className="font-medium capitalize text-slate-800">{project.billing_period ?? '-'}</p>
            </div>
          </>
        )}

        {project.type === 'hour_bank' && (
          <>
            <div>
              <span className="text-slate-400 text-xs">Bank</span>
              <p className="font-medium text-slate-800">{project.total_scoped_hours ?? '-'} hrs</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">Cost</span>
              <p className="font-medium text-slate-800">{formatMoney(project.total_fee, project.total_fee_currency)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
