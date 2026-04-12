'use client';

import { formatHours } from '@/shared/utils/formatHours';

type DaySummaryProps = {
  readonly totalHours: number;
  readonly label?: string;
};

export function DaySummary({ totalHours, label }: DaySummaryProps) {
  return (
    <div className="text-center py-1.5 text-[11px] text-slate-500 border-t border-slate-100">
      {label && <span className="text-slate-400">{label}: </span>}
      <span className="font-semibold text-slate-700">{formatHours(totalHours)}</span>
    </div>
  );
}
