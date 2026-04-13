'use client';

import { useState, type FormEvent } from 'react';
import type { Client, CreateClientInput, UpdateClientInput } from '../types';

type ClientFormProps = {
  readonly client?: Client;
  readonly onSubmit: (data: CreateClientInput | UpdateClientInput) => Promise<void>;
  readonly onCancel: () => void;
};

export function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const [name, setName] = useState(client?.name ?? '');
  const [company, setCompany] = useState(client?.company ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!client;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError('Client name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        company: company.trim() || undefined,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="clay-card w-full max-w-md p-6">
        <h2 className="mb-5 text-lg font-semibold text-black">
          {isEdit ? 'Edit Client' : 'New Client'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="client-name" className="block text-sm font-medium text-charcoal-700">
              Client Name <span className="text-pomegranate-400">*</span>
            </label>
            <input
              id="client-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="clay-input mt-1.5 w-full text-sm"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="client-company" className="block text-sm font-medium text-charcoal-700">
              Company
            </label>
            <input
              id="client-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="clay-input mt-1.5 w-full text-sm"
            />
          </div>
          {error && (
            <p className="text-sm text-pomegranate-600">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="clay-btn clay-btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="clay-btn clay-btn-primary text-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
