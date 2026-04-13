'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllManualEntries } from '@/modules/time-tracking';
import { fetchClients } from '@/modules/clients';
import { fetchAllProjects } from '@/modules/projects';
import type { CalendarEntry } from '../types';

export function useCalendarEntries() {
  const [entries, setEntries] = useState<readonly CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientIds, setClientIds] = useState<readonly string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rawEntries, clients, projects] = await Promise.all([
        fetchAllManualEntries(),
        fetchClients('active'),
        fetchAllProjects(),
      ]);

      const clientMap = new Map(clients.map((c) => [c.id, c.name]));
      const projectMap = new Map(projects.map((p) => [p.id, { name: p.name, clientId: p.client_id }]));

      setClientIds(clients.map((c) => c.id));

      const mapped: CalendarEntry[] = rawEntries.map((e) => {
        const proj = e.project_id ? projectMap.get(e.project_id) : undefined;
        const clientId = proj?.clientId ?? null;
        return {
          id: e.id,
          date: e.date,
          startTime: e.start_time,
          endTime: e.end_time,
          durationHours: e.hours,
          description: e.description,
          clientId,
          clientName: clientId ? (clientMap.get(clientId) ?? 'Unknown') : 'Unknown',
          projectId: e.project_id,
          projectName: proj?.name ?? 'Unknown',
          phaseName: null, // Could resolve if needed
          taskName: null,
          billable: e.billable,
        };
      });

      setEntries(mapped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { entries, clientIds, loading, error, reload: load };
}
