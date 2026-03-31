'use client';

import { useState, useCallback } from 'react';
import { fetchTogglConnection, saveTogglConnection, disconnectToggl } from '../api/toggl';
import type { TogglConnection, TogglWorkspace, TogglProject } from '../types';

export function useTogglSetup() {
  const [connection, setConnection] = useState<TogglConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConnection = useCallback(async () => {
    setLoading(true);
    try {
      const conn = await fetchTogglConnection();
      setConnection(conn);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load connection';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const validateToken = useCallback(async (apiToken: string): Promise<{ valid: boolean; error?: string }> => {
    const response = await fetch('/api/toggl/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiToken }),
    });

    const result = await response.json();
    if (result.error) return { valid: false, error: result.error.message };
    return { valid: true };
  }, []);

  const fetchWorkspaces = useCallback(async (apiToken: string): Promise<TogglWorkspace[]> => {
    const response = await fetch('/api/toggl/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiToken }),
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }, []);

  const fetchProjects = useCallback(async (apiToken: string, workspaceId: string): Promise<TogglProject[]> => {
    const response = await fetch('/api/toggl/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiToken, workspaceId }),
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }, []);

  const connect = useCallback(async (
    apiToken: string,
    workspaceId: string,
    workspaceName: string
  ) => {
    const conn = await saveTogglConnection(apiToken, workspaceId, workspaceName);
    setConnection(conn);
    return conn;
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectToggl();
    setConnection(null);
  }, []);

  return {
    connection,
    loading,
    error,
    loadConnection,
    validateToken,
    fetchWorkspaces,
    fetchProjects,
    connect,
    disconnect,
  };
}
