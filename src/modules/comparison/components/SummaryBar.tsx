'use client';

import type { ComparisonSummary } from '../types';
import { formatHours } from '@/shared/utils/formatHours';

type SummaryBarProps = {
  readonly summary: ComparisonSummary;
};

const STATUS_COLORS = {
  on_track: 'bg-matcha-500',
  warning: 'bg-lemon-500',
  over: 'bg-pomegranate-300/200',
} as const;

const STATUS_BG = {
  on_track: 'bg-matcha-300/20 border-matcha-500',
  warning: 'bg-lemon-400/20 border-lemon-700',
  over: 'bg-pomegranate-300/20 border-pomegranate-400',
} as const;

export function SummaryBar({ summary }: SummaryBarProps) {
  const { totalBudget, totalPlan, totalActual, percentConsumed, status } = summary;
  const barWidth = Math.min(100, percentConsumed);

  return (
    <div className={`rounded-xl border p-4 ${STATUS_BG[status]}`}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <span className="text-charcoal-500">
            Budget: <strong>{totalBudget}h</strong>
          </span>
          <span className="text-charcoal-500">
            Plan: <strong>{totalPlan}h</strong>
          </span>
          <span className="text-charcoal-500">
            Actual: <strong>{formatHours(totalActual)}</strong>
          </span>
        </div>
        <span className="font-medium">
          {percentConsumed.toFixed(0)}% of plan consumed
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-oat-300">
        <div
          className={`h-full rounded-full transition-all ${STATUS_COLORS[status]}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
