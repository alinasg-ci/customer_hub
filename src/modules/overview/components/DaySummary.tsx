'use client';

import { formatHours } from '@/shared/utils/formatHours';

type DaySummaryProps = {
  readonly totalHours: number;
  readonly label?: string;
};

export function DaySummary({ totalHours, label }: DaySummaryProps) {
  return (
    <div className="text-center py-1.5 text-[11px] text-charcoal-500 border-t border-oat-200">
      {label && <span className="text-oat-500">{label}: </span>}
      <span className="font-semibold text-charcoal-700">{formatHours(totalHours)}</span>
    </div>
  );
}
