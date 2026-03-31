'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useClients } from '../hooks/useClients';
import { ClientCard } from './ClientCard';
import { ClientForm } from './ClientForm';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { Client, CreateClientInput, UpdateClientInput } from '../types';

export function ClientList() {
  const { clients, loading, error, add, edit, archive, reload } = useClients('active');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const router = useRouter();

  const handleCreate = useCallback(async (data: CreateClientInput | UpdateClientInput) => {
    await add(data as CreateClientInput);
    setShowForm(false);
  }, [add]);

  const handleEdit = useCallback(async (data: CreateClientInput | UpdateClientInput) => {
    if (!editingClient) return;
    await edit(editingClient.id, data as UpdateClientInput);
    setEditingClient(null);
  }, [edit, editingClient]);

  const handleArchive = useCallback(async (id: string) => {
    await archive(id);
  }, [archive]);

  const handleClick = useCallback((id: string) => {
    router.push(`/client/${id}`);
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={reload} className="mt-2 text-sm font-medium text-red-600 hover:text-red-800">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <button
            onClick={() => setShowForm(true)}
            className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-4xl text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
            aria-label="Create your first client"
          >
            +
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            Create your first client to get started
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Add a client, set up projects, and start tracking your work.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={setEditingClient}
              onArchive={handleArchive}
              onClick={handleClick}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ClientForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
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
