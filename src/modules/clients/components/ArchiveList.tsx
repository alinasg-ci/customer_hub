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
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={reload} className="mt-2 text-sm font-semibold text-red-600 hover:text-red-800">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Archive</h1>
        <p className="mt-1 text-sm text-slate-500">
          Archived clients and their full project history.
        </p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search archived clients..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
        />
      </div>

      {clients.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
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
