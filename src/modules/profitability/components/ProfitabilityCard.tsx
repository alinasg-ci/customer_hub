'use client';

import {
  calculateProjectProfitability,
  calculateRetainerProfitability,
  calculateBankProfitability,
} from '../calculations';
import { cn } from '@/shared/utils/cn';
import type { Project } from '@/modules/projects/types';

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
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Profitability</h3>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
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
    );
  }

  if (project.type === 'retainer') {
    const result = calculateRetainerProfitability(
      project.retainer_fee_ils ?? 0,
      totalExpensesIls,
      actualHours
    );

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Profitability</h3>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Retainer Fee" value={formatIls(result.retainerFee)} />
          <Stat label="Hours Worked" value={`${result.actualHours.toFixed(1)}h`} />
          <Stat label="Expenses" value={formatIls(result.periodExpenses)} />
          <div>
            <span className="text-gray-500">Efficiency</span>
            <p className="text-lg font-bold text-blue-700">{formatIls(result.efficiency)}/h</p>
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
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Profitability</h3>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Bank Value" value={formatIls(result.bankValue)} />
          <Stat label="Consumed" value={`${result.totalConsumed.toFixed(1)}h`} />
          <Stat label="Remaining" value={`${result.remainingHours.toFixed(1)}h`} warn={result.remainingHours < 0} />
          <Stat label="Net Income" value={formatIls(result.netBankIncome)} />
        </div>
        {/* Consumption bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Consumption</span>
            <span>{result.consumptionPercent.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                result.consumptionPercent < 80 ? 'bg-green-500' :
                result.consumptionPercent < 100 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${Math.min(result.consumptionPercent, 100)}%` }}
            />
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
      <span className="text-gray-500">{label}</span>
      <p className={cn('font-semibold', warn ? 'text-red-700' : 'text-gray-900')}>{value}</p>
    </div>
  );
}

function WarningBanner({ message }: { message: string }) {
  return (
    <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </div>
  );
}

function formatIls(amount: number): string {
  return `₪${amount.toLocaleString('en-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
