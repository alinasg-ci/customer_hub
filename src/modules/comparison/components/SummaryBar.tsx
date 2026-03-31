'use client';

import type { ComparisonSummary } from '../types';

type SummaryBarProps = {
  readonly summary: ComparisonSummary;
};

const STATUS_COLORS = {
  on_track: 'bg-green-500',
  warning: 'bg-yellow-500',
  over: 'bg-red-500',
} as const;

const STATUS_BG = {
  on_track: 'bg-green-50 border-green-200',
  warning: 'bg-yellow-50 border-yellow-200',
  over: 'bg-red-50 border-red-200',
} as const;

export function SummaryBar({ summary }: SummaryBarProps) {
  const { totalBudget, totalPlan, totalActual, percentConsumed, status } = summary;
  const barWidth = Math.min(100, percentConsumed);

  return (
    <div className={`rounded-lg border p-4 ${STATUS_BG[status]}`}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <span className="text-gray-600">
            Budget: <strong>{totalBudget}h</strong>
          </span>
          <span className="text-gray-600">
            Plan: <strong>{totalPlan}h</strong>
          </span>
          <span className="text-gray-600">
            Actual: <strong>{totalActual.toFixed(1)}h</strong>
          </span>
        </div>
        <span className="font-medium">
          {percentConsumed.toFixed(0)}% of plan consumed
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${STATUS_COLORS[status]}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
