'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchProjectsByClient, createProject, updateProject, updateProjectStatus } from '../api/projectsApi';
import type { Project, CreateProjectInput, UpdateProjectInput } from '../types';

export function useProjects(clientId: string) {
  const [projects, setProjects] = useState<readonly Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjectsByClient(clientId);
      setProjects(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (input: CreateProjectInput) => {
    const created = await createProject(input);
    setProjects((prev) => [created, ...prev]);
    return created;
  }, []);

  const edit = useCallback(async (id: string, input: UpdateProjectInput) => {
    const updated = await updateProject(id, input);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? updated : p))
    );
    return updated;
  }, []);

  const setStatus = useCallback(async (id: string, status: 'active' | 'pending' | 'closed') => {
    const updated = await updateProjectStatus(id, status);
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? updated : p))
    );
    return updated;
  }, []);

  return { projects, loading, error, add, edit, setStatus, reload: load };
}
