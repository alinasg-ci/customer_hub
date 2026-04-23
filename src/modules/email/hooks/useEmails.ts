'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/shared/hooks/useSupabase';
import type { EmailRow } from '../types';

type Filter = { clientId?: string; projectId?: string };

export function useEmails(filter: Filter) {
  const [emails, setEmails] = useState<readonly EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('emails')
        .select('*')
        .order('sent_at', { ascending: false, nullsFirst: false });
      if (filter.projectId) q = q.eq('project_id', filter.projectId);
      else if (filter.clientId) q = q.eq('client_id', filter.clientId);
      const { data, error: err } = await q;
      if (err) throw err;
      setEmails((data ?? []) as EmailRow[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, [filter.clientId, filter.projectId]);

  useEffect(() => { load(); }, [load]);

  return { emails, loading, error, reload: load };
}
