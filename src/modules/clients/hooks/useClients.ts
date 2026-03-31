'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchClients, createClient, updateClient, archiveClient, reactivateClient, searchClients } from '../api/clientsApi';
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
    const newClient = await createClient(input);
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  }, []);

  const edit = useCallback(async (id: string, input: UpdateClientInput) => {
    const updated = await updateClient(id, input);
    setClients((prev) =>
      prev.map((c) => (c.id === id ? updated : c))
    );
    return updated;
  }, []);

  const archive = useCallback(async (id: string) => {
    const archived = await archiveClient(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    return archived;
  }, []);

  const reactivate = useCallback(async (id: string) => {
    const activated = await reactivateClient(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    return activated;
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

  return { clients, loading, error, add, edit, archive, reactivate, search, reload: load };
}
