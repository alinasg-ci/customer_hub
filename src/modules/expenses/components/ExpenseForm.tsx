'use client';

import { useState, type FormEvent } from 'react';
import type { Currency, ExpenseCategory } from '@/shared/types';
import type { CreateExpenseInput } from '../types';
import type { Phase } from '@/modules/planning/types';

type ExpenseFormProps = {
  readonly projectId: string;
  readonly phases: readonly Phase[];
  readonly onSubmit: (input: CreateExpenseInput) => Promise<void>;
  readonly onCancel: () => void;
};

const CURRENCIES: readonly Currency[] = ['ILS', 'USD', 'EUR'];
const CURRENCY_SYMBOLS: Record<Currency, string> = { ILS: '₪', USD: '$', EUR: '€' };
const CATEGORIES: readonly { value: ExpenseCategory; label: string }[] = [
  { value: 'software', label: 'Software' },
  { value: 'outsourcing', label: 'Outsourcing' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
];

export function ExpenseForm({ projectId, phases, onSubmit, onCancel }: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('ILS');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [phaseId, setPhaseId] = useState('');
  const [attachmentLink, setAttachmentLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim() || !amount) {
      setError('Description and amount are required');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        project_id: projectId,
        description: description.trim(),
        amount: parseFloat(amount),
        currency,
        date,
        category,
        phase_id: phaseId || undefined,
        attachment_link: attachmentLink.trim() || undefined,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Add Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="exp-desc" className="block text-sm font-medium text-gray-700">Description *</label>
            <input
              id="exp-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="exp-amount" className="block text-sm font-medium text-gray-700">Amount *</label>
              <div className="mt-1 flex">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-2 text-sm"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{CURRENCY_SYMBOLS[c]}</option>
                  ))}
                </select>
                <input
                  id="exp-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full rounded-r-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="exp-date" className="block text-sm font-medium text-gray-700">Date *</label>
              <input
                id="exp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="exp-cat" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                id="exp-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="exp-phase" className="block text-sm font-medium text-gray-700">Phase</label>
              <select
                id="exp-phase"
                value={phaseId}
                onChange={(e) => setPhaseId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">General (no phase)</option>
                {phases.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="exp-link" className="block text-sm font-medium text-gray-700">Attachment Link</label>
            <input
              id="exp-link"
              type="url"
              value={attachmentLink}
              onChange={(e) => setAttachmentLink(e.target.value)}
              placeholder="https://..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
