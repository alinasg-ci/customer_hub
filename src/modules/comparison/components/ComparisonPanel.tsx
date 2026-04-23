'use client';

import { useComparison } from '../hooks/useComparison';
import { SummaryBar } from './SummaryBar';
import { Skeleton } from '@/shared/ui/Skeleton';
import { formatHours } from '@/shared/utils/formatHours';
import type { Phase } from '@/modules/planning';
import type { TimeEntry } from '@/modules/time-tracking';

type ComparisonPanelProps = {
  readonly projectId: string;
  readonly phases: readonly Phase[];
  readonly timeEntries: readonly TimeEntry[];
};

const STATUS_ICONS = {
  on_track: '✓',
  warning: '⚠',
  over: '⚠',
} as const;

const STATUS_STYLES = {
  on_track: 'text-matcha-600',
  warning: 'text-lemon-700',
  over: 'text-pomegranate-600 font-medium',
} as const;

export function ComparisonPanel({ projectId, phases, timeEntries }: ComparisonPanelProps) {
  const {
    rows,
    summary,
    phaseLinks,
    loading,
    error,
    autoGenerate,
  } = useComparison(projectId, phases, timeEntries);

  if (loading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-pomegranate-400 bg-pomegranate-300/20 p-4">
        <p className="text-sm text-pomegranate-600">{error}</p>
      </div>
    );
  }

  if (phaseLinks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-oat-500 p-6 text-center">
        <p className="text-sm text-charcoal-500">No phase links yet. Auto-generate from your phases?</p>
        <button
          onClick={autoGenerate}
          className="mt-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-900"
        >
          Auto-generate links
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SummaryBar summary={summary} />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-oat-300 text-left text-xs font-medium uppercase tracking-wide text-charcoal-500">
              <th className="py-2 pr-4">Phase</th>
              <th className="py-2 px-3 text-right">Budget</th>
              <th className="py-2 px-3 text-right">Plan</th>
              <th className="py-2 px-3 text-right">Actual</th>
              <th className="py-2 px-3 text-right">Remaining</th>
              <th className="py-2 pl-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.phaseLinkId} className="border-b border-oat-200 hover:bg-cream">
                <td className="py-2 pr-4">
                  <div>
                    <span className="font-medium text-black">{row.canonicalName}</span>
                    {(row.budgetPhaseName || row.planPhaseName) &&
                      row.budgetPhaseName !== row.planPhaseName && (
                        <span
                          className="ml-1 text-xs text-charcoal-300 cursor-help"
                          title={`Budget: "${row.budgetPhaseName ?? '—'}" | Plan: "${row.planPhaseName ?? '—'}"`}
                        >
                          ⓘ
                        </span>
                      )}
                  </div>
                </td>
                <td className="py-2 px-3 text-right text-charcoal-500">
                  {row.budgetHours > 0 ? `${row.budgetHours}h` : '—'}
                </td>
                <td className="py-2 px-3 text-right text-charcoal-500">
                  {row.planHours > 0 ? `${row.planHours}h` : '—'}
                </td>
                <td className="py-2 px-3 text-right text-black font-medium">
                  {row.actualHours > 0 ? formatHours(row.actualHours) : '0h'}
                </td>
                <td className={`py-2 px-3 text-right ${row.remaining >= 0 ? 'text-matcha-600' : 'text-pomegranate-600 font-medium'}`}>
                  {formatHours(row.remaining)}
                  {row.remaining < 0 && ' ⚠'}
                </td>
                <td className={`py-2 pl-3 ${STATUS_STYLES[row.status]}`}>
                  {STATUS_ICONS[row.status]}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-oat-500 font-medium">
              <td className="py-2 pr-4 text-black">TOTAL</td>
              <td className="py-2 px-3 text-right">{summary.totalBudget}h</td>
              <td className="py-2 px-3 text-right">{summary.totalPlan}h</td>
              <td className="py-2 px-3 text-right">{formatHours(summary.totalActual)}</td>
              <td className={`py-2 px-3 text-right ${summary.totalPlan - summary.totalActual >= 0 ? 'text-matcha-600' : 'text-pomegranate-600'}`}>
                {formatHours(summary.totalPlan - summary.totalActual)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
