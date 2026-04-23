'use client';

import { useState } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { ExpenseForm } from './ExpenseForm';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { Phase } from '@/modules/planning';
import type { CreateExpenseInput, Expense } from '../types';
import type { ExpenseCategory } from '@/shared/types';

type ExpenseListProps = {
  readonly projectId: string;
  readonly phases: readonly Phase[];
};

const CURRENCY_SYMBOLS: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' };
const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  software: 'Software',
  outsourcing: 'Outsourcing',
  travel: 'Travel',
  other: 'Other',
};

export function ExpenseList({ projectId, phases }: ExpenseListProps) {
  const { expenses, loading, error, add, remove, totalIls } = useExpenses(projectId);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPhase, setFilterPhase] = useState<string>('');

  const filtered = expenses.filter((e) => {
    if (filterCategory && e.category !== filterCategory) return false;
    if (filterPhase === '__general' && e.phase_id !== null) return false;
    if (filterPhase && filterPhase !== '__general' && e.phase_id !== filterPhase) return false;
    return true;
  });

  async function handleAdd(input: CreateExpenseInput) {
    await add(input);
    setShowForm(false);
  }

  function formatMoney(expense: Expense): string {
    const symbol = CURRENCY_SYMBOLS[expense.currency] ?? '';
    return `${symbol}${expense.amount.toLocaleString('en-IL', { minimumFractionDigits: 2 })}`;
  }

  function getPhaseName(phaseId: string | null): string {
    if (!phaseId) return 'General';
    const phase = phases.find((p) => p.id === phaseId);
    return phase?.name ?? 'Unknown';
  }

  if (loading) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-black">Expenses</h3>
          <p className="text-sm text-charcoal-500">
            Total: ₪{totalIls.toLocaleString('en-IL', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-charcoal-900"
        >
          + Add Expense
        </button>
      </div>

      {/* Filters */}
      {expenses.length > 0 && (
        <div className="mb-3 flex gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-oat-300 px-2 py-1 text-xs focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="rounded-lg border border-oat-300 px-2 py-1 text-xs focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="">All phases</option>
            <option value="__general">General (no phase)</option>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {error ? (
        <p className="text-sm text-pomegranate-600">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-charcoal-300">
          {expenses.length === 0 ? 'No expenses yet.' : 'No expenses match the filters.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-oat-300 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream">
                <th className="px-3 py-2 text-left font-medium text-charcoal-500">Date</th>
                <th className="px-3 py-2 text-left font-medium text-charcoal-500">Description</th>
                <th className="px-3 py-2 text-left font-medium text-charcoal-500">Category</th>
                <th className="px-3 py-2 text-left font-medium text-charcoal-500">Phase</th>
                <th className="px-3 py-2 text-right font-medium text-charcoal-500">Amount</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oat-200">
              {filtered.map((expense) => (
                <tr key={expense.id} className="group">
                  <td className="px-3 py-2 text-charcoal-500">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 font-medium text-black">{expense.description}</td>
                  <td className="px-3 py-2 text-charcoal-500">{CATEGORY_LABELS[expense.category]}</td>
                  <td className="px-3 py-2 text-charcoal-500">{getPhaseName(expense.phase_id)}</td>
                  <td className="px-3 py-2 text-right font-medium text-black">
                    {expense.currency === 'ILS' ? (
                      formatMoney(expense)
                    ) : (
                      <span title={`${formatMoney(expense)} at ${expense.exchange_rate_used} on ${expense.exchange_rate_date}`}>
                        ₪{expense.amount_ils.toLocaleString('en-IL', { minimumFractionDigits: 2 })}
                        <span className="ml-1 text-xs font-normal text-charcoal-300">
                          ({formatMoney(expense)})
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => remove(expense.id)}
                      className="rounded-lg p-1.5 text-oat-500 opacity-0 hover:text-pomegranate-600 group-hover:opacity-100"
                      aria-label="Delete expense"
                    >
                      x
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ExpenseForm
          projectId={projectId}
          phases={phases as Phase[]}
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
