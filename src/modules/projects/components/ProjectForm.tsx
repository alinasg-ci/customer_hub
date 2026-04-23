'use client';

import { useState, useMemo, type FormEvent } from 'react';
import type { ProjectType, Currency, BillingPeriod } from '@/shared/types';
import type { Project, CreateProjectInput } from '../types';

type ProjectFormProps = {
  readonly clientId: string;
  readonly project?: Project;
  readonly onSubmit: (data: CreateProjectInput) => Promise<void>;
  readonly onCancel: () => void;
};

const CURRENCIES: readonly Currency[] = ['ILS', 'USD', 'EUR'];
const CURRENCY_SYMBOLS: Record<Currency, string> = { ILS: '\u20AA', USD: '$', EUR: '\u20AC' };

export function ProjectForm({ clientId, project, onSubmit, onCancel }: ProjectFormProps) {
  const isEdit = Boolean(project);
  const [name, setName] = useState(project?.name ?? '');
  const [type, setType] = useState<ProjectType>(project?.type ?? 'project');
  const [rateCurrency, setRateCurrency] = useState<Currency>(project?.rate_currency ?? 'ILS');
  const [ratePerHour, setRatePerHour] = useState(project?.rate_per_hour?.toString() ?? '');
  const [totalScopedHours, setTotalScopedHours] = useState(project?.total_scoped_hours?.toString() ?? '');
  const [deadline, setDeadline] = useState(project?.deadline ?? '');
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(project?.billing_period ?? 'monthly');
  const [retainerFee, setRetainerFee] = useState(project?.retainer_fee?.toString() ?? '');
  const [retainerFeeCurrency, setRetainerFeeCurrency] = useState<Currency>(project?.retainer_fee_currency ?? 'ILS');
  const [startDate, setStartDate] = useState(project?.start_date ?? '');
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
              rate_per_hour: isNaN(parseFloat(ratePerHour)) ? undefined : parseFloat(ratePerHour),
              rate_currency: rateCurrency,
              total_scoped_hours: isNaN(parseFloat(totalScopedHours)) ? undefined : parseFloat(totalScopedHours),
              deadline: deadline || undefined,
            }
          : {}),
        ...(type === 'retainer'
          ? {
              retainer_fee: isNaN(parseFloat(retainerFee)) ? undefined : parseFloat(retainerFee),
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

  const inputClass = "mt-1.5 block w-full rounded-lg border border-oat-300 px-3 py-2 text-sm transition-colors focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10";
  const labelClass = "block text-sm font-medium text-charcoal-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-oat-300 bg-white p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-semibold text-black">{isEdit ? 'Edit Project' : 'New Project'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="project-name" className={labelClass}>
              Project Name <span className="text-pomegranate-400">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className={`${labelClass} mb-2`}>Project Type <span className="text-pomegranate-400">*</span></label>
            <div className="flex gap-2">
              {(['project', 'retainer', 'hour_bank'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => !isEdit && setType(t)}
                  disabled={isEdit}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    type === t
                      ? 'border-black bg-oat-100 text-black'
                      : 'border-oat-300 bg-white text-charcoal-500 hover:bg-cream'
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
                  <label htmlFor="rate" className={labelClass}>
                    Rate per Hour
                  </label>
                  <div className="mt-1.5 flex">
                    <select
                      value={rateCurrency}
                      onChange={(e) => setRateCurrency(e.target.value as Currency)}
                      className="rounded-l-lg border border-r-0 border-oat-300 bg-cream px-2 text-sm text-charcoal-500"
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
                      className="block w-full rounded-r-lg border border-oat-300 px-3 py-2 text-sm transition-colors focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="hours" className={labelClass}>
                    {type === 'hour_bank' ? 'Total Bank Hours' : 'Scoped Hours'}
                  </label>
                  <input
                    id="hours"
                    type="number"
                    step="0.5"
                    value={totalScopedHours}
                    onChange={(e) => setTotalScopedHours(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {autoFee !== null && (
                <div className="rounded-lg bg-oat-100 px-3.5 py-2.5 text-sm text-black">
                  Total {type === 'hour_bank' ? 'cost' : 'fee'}:{' '}
                  <span className="font-semibold">
                    {CURRENCY_SYMBOLS[rateCurrency]}{autoFee.toLocaleString('en-IL', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {type === 'project' && (
                <div>
                  <label htmlFor="deadline" className={labelClass}>Deadline</label>
                  <input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
            </>
          )}

          {type === 'retainer' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="retainer-fee" className={labelClass}>Periodic Fee</label>
                  <div className="mt-1.5 flex">
                    <select
                      value={retainerFeeCurrency}
                      onChange={(e) => setRetainerFeeCurrency(e.target.value as Currency)}
                      className="rounded-l-lg border border-r-0 border-oat-300 bg-cream px-2 text-sm text-charcoal-500"
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
                      className="block w-full rounded-r-lg border border-oat-300 px-3 py-2 text-sm transition-colors focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="billing-period" className={labelClass}>Billing Period</label>
                  <select
                    id="billing-period"
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value as BillingPeriod)}
                    className={inputClass}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="start-date" className={labelClass}>Start Date</label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-pomegranate-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-oat-300 px-4 py-2 text-sm font-medium text-charcoal-700 transition-colors hover:bg-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-charcoal-900 disabled:opacity-50"
            >
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
