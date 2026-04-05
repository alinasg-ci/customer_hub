'use client';

import { cn } from '@/shared/utils/cn';
import type { ComparisonRow } from '../types';

type ComparisonViewProps = {
  readonly rows: readonly ComparisonRow[];
  readonly totalQuoted: number;
  readonly totalInternal: number;
};

export function ComparisonView({ rows, totalQuoted, totalInternal }: ComparisonViewProps) {
  const totalDelta = totalInternal - totalQuoted;

  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">
        Add phases to see the comparison view.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-4 py-2 text-left font-medium text-slate-500">Phase</th>
            <th className="px-4 py-2 text-right font-medium text-slate-500">Quoted</th>
            <th className="px-4 py-2 text-right font-medium text-slate-500">Internal</th>
            <th className="px-4 py-2 text-right font-medium text-slate-500">Delta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(({ phase, quotedHours, internalHours, delta, overBudget }) => (
            <tr key={phase.id} className={cn(overBudget && 'bg-red-50')}>
              <td className="px-4 py-2 font-medium text-slate-900">
                {phase.name}
                {overBudget && (
                  <span className="ml-2 inline-flex rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-700">
                    over
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-right text-slate-700">{quotedHours}h</td>
              <td className="px-4 py-2 text-right text-slate-700">{internalHours}h</td>
              <td className={cn(
                'px-4 py-2 text-right font-medium',
                delta > 0 ? 'text-red-600' : delta < 0 ? 'text-emerald-600' : 'text-slate-400'
              )}>
                {delta > 0 ? '+' : ''}{delta}h
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
            <td className="px-4 py-2 text-slate-900">Total</td>
            <td className="px-4 py-2 text-right text-slate-900">{totalQuoted}h</td>
            <td className="px-4 py-2 text-right text-slate-900">{totalInternal}h</td>
            <td className={cn(
              'px-4 py-2 text-right',
              totalDelta > 0 ? 'text-red-600' : totalDelta < 0 ? 'text-emerald-600' : 'text-slate-400'
            )}>
              {totalDelta > 0 ? '+' : ''}{totalDelta}h
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
