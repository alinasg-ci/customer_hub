'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchClients, createClient, updateClient, archiveClient, reactivateClient, searchClients, deleteClient } from '../api/clientsApi';
import type { Client, CreateClientInput, UpdateClientInput } from '../types';

export function useClients(status: 'active' | 'archived' = 'active') {
  const [clients, setClients] = useState<readonly Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients(status);
      setClients(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load clients';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (input: CreateClientInput) => {
    try {
      const newClient = await createClient(input);
      setClients((prev) => [newClient, ...prev]);
      return newClient;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create client';
      setError(message);
      throw err;
    }
  }, []);

  const edit = useCallback(async (id: string, input: UpdateClientInput) => {
    try {
      const updated = await updateClient(id, input);
      setClients((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update client';
      setError(message);
      throw err;
    }
  }, []);

  const archive = useCallback(async (id: string) => {
    try {
      const archived = await archiveClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      return archived;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to archive client';
      setError(message);
      throw err;
    }
  }, []);

  const reactivate = useCallback(async (id: string) => {
    try {
      const activated = await reactivateClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      return activated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reactivate client';
      setError(message);
      throw err;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete client';
      setError(message);
      throw err;
    }
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      await load();
      return;
    }
    setLoading(true);
    try {
      const data = await searchClients(query, status);
      setClients(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [status, load]);

  return { clients, loading, error, add, edit, archive, reactivate, remove, search, reload: load };
}
