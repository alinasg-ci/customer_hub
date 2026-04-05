'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useClients } from '../hooks/useClients';
import { ClientCard } from './ClientCard';
import { ClientForm } from './ClientForm';
import { ConfirmDeleteDialog } from '@/shared/ui/ConfirmDeleteDialog';
import { Skeleton } from '@/shared/ui/Skeleton';
import type { Client, CreateClientInput, UpdateClientInput } from '../types';

export function ClientList() {
  const { clients, loading, error, add, edit, archive, remove, reload } = useClients('active');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  const handleDeleteClick = useCallback((id: string) => {
    const client = clients.find((c) => c.id === id);
    if (client) setDeletingClient(client);
  }, [clients]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingClient) return;
    setDeleteLoading(true);
    try {
      await remove(deletingClient.id);
      setDeletingClient(null);
    } catch {
      // Error handled by hook
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingClient, remove]);

  const handleClick = useCallback((id: string) => {
    router.push(`/client/${id}`);
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="mb-8 flex items-end justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[72px] rounded-xl" />
          <Skeleton className="h-[72px] rounded-xl" />
          <Skeleton className="h-[72px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={reload} className="mt-2 text-sm font-medium text-red-600 hover:text-red-800">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">
            {clients.length} active {clients.length === 1 ? 'client' : 'clients'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-20">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No clients yet</h2>
          <p className="mt-1.5 max-w-sm text-center text-sm text-slate-500">
            Add your first client to start tracking projects, hours, and profitability.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-6 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create your first client
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={setEditingClient}
              onArchive={handleArchive}
              onDelete={handleDeleteClick}
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

      <ConfirmDeleteDialog
        open={deletingClient !== null}
        title="Delete client"
        message={`Permanently delete "${deletingClient?.name ?? ''}" and all its projects, data, and history? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingClient(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
