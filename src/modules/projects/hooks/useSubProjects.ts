'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchSubProjects, createSubProject, updateSubProject, deleteSubProject } from '../api/projectsApi';
import type { SubProject, CreateSubProjectInput, UpdateSubProjectInput } from '../types';

export function useSubProjects(projectId: string) {
  const [subProjects, setSubProjects] = useState<readonly SubProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSubProjects(projectId);
      setSubProjects(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load sub-projects';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (input: CreateSubProjectInput) => {
    const created = await createSubProject(input);
    setSubProjects((prev) => [...prev, created]);
    return created;
  }, []);

  const edit = useCallback(async (id: string, input: UpdateSubProjectInput) => {
    const updated = await updateSubProject(id, input);
    setSubProjects((prev) =>
      prev.map((sp) => (sp.id === id ? updated : sp))
    );
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteSubProject(id);
    setSubProjects((prev) => prev.filter((sp) => sp.id !== id));
  }, []);

  const totalAllocated = subProjects.reduce((sum, sp) => sum + (sp.allocated_hours ?? 0), 0);

  return { subProjects, loading, error, add, edit, remove, totalAllocated, reload: load };
}
