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
  const [domains, setDomains] = useState<string[]>([...(client?.email_domains ?? [])]);
  const [contacts, setContacts] = useState<string[]>([...(client?.contact_emails ?? [])]);
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
        email_domains: domains
          .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
          .filter(Boolean),
        contact_emails: contacts
          .map((c) => c.trim().toLowerCase())
          .filter(Boolean),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 py-8 backdrop-blur-sm">
      <div className="clay-card-static w-full max-w-md overflow-hidden">
        <div className="h-[6px] bg-matcha-500" />
        <div className="p-6">
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

            <RepeatableList
              label="Email domains"
              placeholder="acme.com"
              description="Emails from these domains auto-route to this client."
              values={domains}
              onChange={setDomains}
              prefix="@"
            />

            <RepeatableList
              label="Contact emails"
              placeholder="jane@acme.com"
              description="Specific people. Used when the domain isn't dedicated."
              values={contacts}
              onChange={setContacts}
            />

            {error && <p className="text-sm text-pomegranate-600">{error}</p>}

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
    </div>
  );
}

function RepeatableList({
  label,
  description,
  placeholder,
  values,
  onChange,
  prefix,
}: {
  readonly label: string;
  readonly description?: string;
  readonly placeholder: string;
  readonly values: readonly string[];
  readonly onChange: (next: string[]) => void;
  readonly prefix?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal-700">{label}</label>
      {description && (
        <p className="mt-0.5 text-[11px] text-charcoal-500">{description}</p>
      )}
      <div className="mt-1.5 space-y-1.5">
        {values.map((v, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {prefix && <span className="clay-mono text-sm text-charcoal-500">{prefix}</span>}
            <input
              type="text"
              value={v}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...values];
                next[idx] = e.target.value;
                onChange(next);
              }}
              className="clay-input flex-1 text-sm"
            />
            <button
              type="button"
              aria-label="Remove"
              onClick={() => onChange(values.filter((_, i) => i !== idx))}
              className="rounded-[10px] p-1.5 text-oat-500 transition-colors hover:bg-pomegranate-300/20 hover:text-pomegranate-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...values, ''])}
          className="text-xs font-medium text-black underline underline-offset-4 decoration-dashed hover:text-charcoal-500"
        >
          + Add {label.toLowerCase()}
        </button>
      </div>
    </div>
  );
}
