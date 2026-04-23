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
      <p className="py-8 text-center text-sm text-charcoal-300">
        Add phases to see the comparison view.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-oat-300 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-cream">
            <th className="px-4 py-2 text-left font-medium text-charcoal-500">Phase</th>
            <th className="px-4 py-2 text-right font-medium text-charcoal-500">Quoted</th>
            <th className="px-4 py-2 text-right font-medium text-charcoal-500">Internal</th>
            <th className="px-4 py-2 text-right font-medium text-charcoal-500">Delta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-oat-200">
          {rows.map(({ phase, quotedHours, internalHours, delta, overBudget }) => (
            <tr key={phase.id} className={cn(overBudget && 'bg-pomegranate-300/20')}>
              <td className="px-4 py-2 font-medium text-black">
                {phase.name}
                {overBudget && (
                  <span className="ml-2 inline-flex rounded-full bg-pomegranate-300/30 px-1.5 py-0.5 text-xs text-pomegranate-600">
                    over
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-right text-charcoal-700">{quotedHours}h</td>
              <td className="px-4 py-2 text-right text-charcoal-700">{internalHours}h</td>
              <td className={cn(
                'px-4 py-2 text-right font-medium',
                delta > 0 ? 'text-pomegranate-600' : delta < 0 ? 'text-matcha-600' : 'text-charcoal-300'
              )}>
                {delta > 0 ? '+' : ''}{delta}h
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-oat-300 bg-cream font-semibold">
            <td className="px-4 py-2 text-black">Total</td>
            <td className="px-4 py-2 text-right text-black">{totalQuoted}h</td>
            <td className="px-4 py-2 text-right text-black">{totalInternal}h</td>
            <td className={cn(
              'px-4 py-2 text-right',
              totalDelta > 0 ? 'text-pomegranate-600' : totalDelta < 0 ? 'text-matcha-600' : 'text-charcoal-300'
            )}>
              {totalDelta > 0 ? '+' : ''}{totalDelta}h
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
