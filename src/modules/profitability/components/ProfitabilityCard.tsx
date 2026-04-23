'use client';

import {
  calculateProjectProfitability,
  calculateRetainerProfitability,
  calculateBankProfitability,
} from '../calculations';
import { cn } from '@/shared/utils/cn';
import type { Project } from '@/modules/projects';

type ProfitabilityCardProps = {
  readonly project: Project;
  readonly actualHours: number;
  readonly totalExpensesIls: number;
};

export function ProfitabilityCard({ project, actualHours, totalExpensesIls }: ProfitabilityCardProps) {
  if (project.type === 'project') {
    const result = calculateProjectProfitability(
      project.rate_per_hour_ils ?? 0,
      project.total_scoped_hours ?? 0,
      actualHours,
      totalExpensesIls
    );

    return (
      <div className="clay-card-static overflow-hidden">
        <div className="h-[6px] bg-matcha-500" />
        <div className="p-5">
        <div className="clay-label mb-1">FINANCES</div>
        <h3 className="mb-4 text-lg font-semibold text-black">Profitability</h3>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Stat label="Project Value" value={formatIls(result.projectValue)} />
          <Stat label="Actual Income" value={formatIls(result.actualIncome)} />
          <Stat label="Effective Rate" value={`${formatIls(result.effectiveRate)}/h`} warn={result.overBudget} />
          <Stat label="Net Income" value={formatIls(result.netIncome)} />
          <Stat label="Profit Margin" value={`${result.profitMargin.toFixed(1)}%`} />
          <Stat label="Expenses" value={formatIls(result.totalExpenses)} />
          <Stat label="Hours" value={`${actualHours} / ${project.total_scoped_hours ?? 0}`} />
          {result.overBudget && (
            <Stat label="Unbilled" value={`${result.unbilledHours.toFixed(1)}h (${formatIls(result.unbilledCost)})`} warn />
          )}
        </div>
        {result.overBudget && (
          <WarningBanner
            message={`Over budget by ${result.unbilledHours.toFixed(1)} hours. Effective rate dropped to ${formatIls(result.effectiveRate)}/h. Unbilled cost: ${formatIls(result.unbilledCost)}.`}
          />
        )}
        </div>
      </div>
    );
  }

  if (project.type === 'retainer') {
    const result = calculateRetainerProfitability(
      project.retainer_fee_ils ?? 0,
      totalExpensesIls,
      actualHours
    );

    return (
      <div className="clay-card-static overflow-hidden">
        <div className="h-[6px] bg-slushie-500" />
        <div className="p-5">
        <div className="clay-label mb-1">FINANCES</div>
        <h3 className="mb-4 text-lg font-semibold text-black">Profitability</h3>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Stat label="Retainer Fee" value={formatIls(result.retainerFee)} />
          <Stat label="Hours Worked" value={`${result.actualHours.toFixed(1)}h`} />
          <Stat label="Expenses" value={formatIls(result.periodExpenses)} />
          <div>
            <span className="clay-label">Efficiency</span>
            <p className="text-lg font-bold text-black">{formatIls(result.efficiency)}/h</p>
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (project.type === 'hour_bank') {
    const result = calculateBankProfitability(
      project.rate_per_hour_ils ?? 0,
      project.total_scoped_hours ?? 0,
      actualHours,
      totalExpensesIls
    );

    return (
      <div className="clay-card-static overflow-hidden">
        <div className="h-[6px] bg-ube-500" />
        <div className="p-5">
        <div className="clay-label mb-1">FINANCES</div>
        <h3 className="mb-4 text-lg font-semibold text-black">Profitability</h3>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Stat label="Bank Value" value={formatIls(result.bankValue)} />
          <Stat label="Consumed" value={`${result.totalConsumed.toFixed(1)}h`} />
          <Stat label="Remaining" value={`${result.remainingHours.toFixed(1)}h`} warn={result.remainingHours < 0} />
          <Stat label="Net Income" value={formatIls(result.netBankIncome)} />
        </div>
        {/* Consumption bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-charcoal-500 mb-1.5">
            <span>Consumption</span>
            <span className="font-medium">{result.consumptionPercent.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-oat-200">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                result.consumptionPercent < 80 ? 'bg-matcha-500' :
                result.consumptionPercent < 100 ? 'bg-lemon-500' : 'bg-pomegranate-600'
              )}
              style={{ width: `${Math.min(result.consumptionPercent, 100)}%` }}
            />
          </div>
        </div>
        </div>
      </div>
    );
  }

  return null;
}

function Stat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <span className="clay-label">{label}</span>
      <p className={cn('clay-mono mt-0.5 text-lg font-semibold', warn ? 'text-pomegranate-600' : 'text-black')}>{value}</p>
    </div>
  );
}

function WarningBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-lg border border-pomegranate-400 bg-pomegranate-300/20 px-3.5 py-2.5 text-sm text-pomegranate-600">
      {message}
    </div>
  );
}

function formatIls(amount: number): string {
  return `\u20AA${amount.toLocaleString('en-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
