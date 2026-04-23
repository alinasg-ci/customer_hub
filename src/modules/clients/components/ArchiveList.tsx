'use client';

import { useState } from 'react';
import { useClients } from '../hooks/useClients';
import { ClientCard } from './ClientCard';
import { ClientForm } from './ClientForm';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { Client, UpdateClientInput } from '../types';

export function ArchiveList() {
  const { clients, loading, error, edit, reactivate, search, reload } = useClients('archived');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  function handleSearch(query: string) {
    setSearchQuery(query);
    search(query);
  }

  async function handleEdit(data: UpdateClientInput) {
    if (!editingClient) return;
    await edit(editingClient.id, data);
    setEditingClient(null);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-pomegranate-400 bg-pomegranate-300/20 p-4">
        <p className="text-sm text-pomegranate-600">{error}</p>
        <button onClick={reload} className="mt-2 text-sm font-semibold text-pomegranate-600 hover:text-pomegranate-600">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative mb-8">
        <div className="clay-label">STORAGE · READ-ONLY</div>
        <h1
          className="my-2 font-semibold text-black"
          style={{
            fontSize: 'clamp(44px, 6vw, 72px)',
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            fontFeatureSettings: '"ss01","ss03"',
          }}
        >
          <em className="not-italic text-ube-500">Archive</em>.
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-charcoal-500">
          Archived clients and their full project history — searchable, reactivatable.
        </p>
        {clients.length > 0 && (
          <div className="clay-sticker absolute right-2 top-2 hidden sm:inline-flex" style={{ transform: 'rotate(-6deg)' }}>
            ★ {clients.length} archived
          </div>
        )}
      </section>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Search archived clients..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="clay-input w-full max-w-sm text-sm"
        />
      </div>

      {clients.length === 0 ? (
        <p className="py-12 text-center text-sm text-charcoal-500">
          {searchQuery ? 'No archived clients match your search.' : 'No archived clients yet.'}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={setEditingClient}
              onArchive={() => {}}
              onReactivate={reactivate}
              onClick={() => {}}
            />
          ))}
        </div>
      )}

      {editingClient && (
        <ClientForm
          client={editingClient}
          onSubmit={handleEdit}
          onCancel={() => setEditingClient(null)}
        />
      )}
    </div>
  );
}
