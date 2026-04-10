'use client';

import type { ComparisonSummary } from '../types';
import { formatHours } from '@/shared/utils/formatHours';

type SummaryBarProps = {
  readonly summary: ComparisonSummary;
};

const STATUS_COLORS = {
  on_track: 'bg-emerald-500',
  warning: 'bg-amber-500',
  over: 'bg-red-500',
} as const;

const STATUS_BG = {
  on_track: 'bg-emerald-50 border-emerald-200',
  warning: 'bg-amber-50 border-amber-200',
  over: 'bg-red-50 border-red-200',
} as const;

export function SummaryBar({ summary }: SummaryBarProps) {
  const { totalBudget, totalPlan, totalActual, percentConsumed, status } = summary;
  const barWidth = Math.min(100, percentConsumed);

  return (
    <div className={`rounded-xl border p-4 ${STATUS_BG[status]}`}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <span className="text-slate-500">
            Budget: <strong>{totalBudget}h</strong>
          </span>
          <span className="text-slate-500">
            Plan: <strong>{totalPlan}h</strong>
          </span>
          <span className="text-slate-500">
            Actual: <strong>{formatHours(totalActual)}</strong>
          </span>
        </div>
        <span className="font-medium">
          {percentConsumed.toFixed(0)}% of plan consumed
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${STATUS_COLORS[status]}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
