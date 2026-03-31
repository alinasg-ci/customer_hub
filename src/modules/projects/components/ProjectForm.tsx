'use client';

import { useState, useMemo, type FormEvent } from 'react';
import type { ProjectType, Currency, BillingPeriod } from '@/shared/types';
import type { CreateProjectInput } from '../types';

type ProjectFormProps = {
  readonly clientId: string;
  readonly onSubmit: (data: CreateProjectInput) => Promise<void>;
  readonly onCancel: () => void;
};

const CURRENCIES: readonly Currency[] = ['ILS', 'USD', 'EUR'];
const CURRENCY_SYMBOLS: Record<Currency, string> = { ILS: '₪', USD: '$', EUR: '€' };

export function ProjectForm({ clientId, onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('project');
  const [rateCurrency, setRateCurrency] = useState<Currency>('ILS');
  const [ratePerHour, setRatePerHour] = useState('');
  const [totalScopedHours, setTotalScopedHours] = useState('');
  const [deadline, setDeadline] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [retainerFee, setRetainerFee] = useState('');
  const [retainerFeeCurrency, setRetainerFeeCurrency] = useState<Currency>('ILS');
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoFee = useMemo(() => {
    const rate = parseFloat(ratePerHour);
    const hours = parseFloat(totalScopedHours);
    if (!isNaN(rate) && !isNaN(hours)) return rate * hours;
    return null;
  }, [ratePerHour, totalScopedHours]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const input: CreateProjectInput = {
        client_id: clientId,
        name: name.trim(),
        type,
        ...(type === 'project' || type === 'hour_bank'
          ? {
              rate_per_hour: parseFloat(ratePerHour) || undefined,
              rate_currency: rateCurrency,
              total_scoped_hours: parseFloat(totalScopedHours) || undefined,
              deadline: deadline || undefined,
            }
          : {}),
        ...(type === 'retainer'
          ? {
              retainer_fee: parseFloat(retainerFee) || undefined,
              retainer_fee_currency: retainerFeeCurrency,
              billing_period: billingPeriod,
              start_date: startDate || undefined,
            }
          : {}),
      };

      await onSubmit(input);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">
              Project Name *
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Type *</label>
            <div className="flex gap-2">
              {(['project', 'retainer', 'hour_bank'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    type === t
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t === 'hour_bank' ? 'Hour Bank' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {(type === 'project' || type === 'hour_bank') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="rate" className="block text-sm font-medium text-gray-700">
                    Rate per Hour
                  </label>
                  <div className="mt-1 flex">
                    <select
                      value={rateCurrency}
                      onChange={(e) => setRateCurrency(e.target.value as Currency)}
                      className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-2 text-sm"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{CURRENCY_SYMBOLS[c]}</option>
                      ))}
                    </select>
                    <input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={ratePerHour}
                      onChange={(e) => setRatePerHour(e.target.value)}
                      className="block w-full rounded-r-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
                    {type === 'hour_bank' ? 'Total Bank Hours' : 'Scoped Hours'}
                  </label>
                  <input
                    id="hours"
                    type="number"
                    step="0.5"
                    value={totalScopedHours}
                    onChange={(e) => setTotalScopedHours(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {autoFee !== null && (
                <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  Total {type === 'hour_bank' ? 'cost' : 'fee'}:{' '}
                  <span className="font-semibold">
                    {CURRENCY_SYMBOLS[rateCurrency]}{autoFee.toLocaleString('en-IL', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {type === 'project' && (
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                    Deadline
                  </label>
                  <input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </>
          )}

          {type === 'retainer' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="retainer-fee" className="block text-sm font-medium text-gray-700">
                    Periodic Fee
                  </label>
                  <div className="mt-1 flex">
                    <select
                      value={retainerFeeCurrency}
                      onChange={(e) => setRetainerFeeCurrency(e.target.value as Currency)}
                      className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-2 text-sm"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{CURRENCY_SYMBOLS[c]}</option>
                      ))}
                    </select>
                    <input
                      id="retainer-fee"
                      type="number"
                      step="0.01"
                      value={retainerFee}
                      onChange={(e) => setRetainerFee(e.target.value)}
                      className="block w-full rounded-r-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="billing-period" className="block text-sm font-medium text-gray-700">
                    Billing Period
                  </label>
                  <select
                    id="billing-period"
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value as BillingPeriod)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
