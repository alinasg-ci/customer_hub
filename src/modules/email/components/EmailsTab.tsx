'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/shared/hooks/useSupabase';
import { Skeleton } from '@/shared/ui/Skeleton';
import { EmailCard } from './EmailCard';
import { ManualEmailForm } from './ManualEmailForm';
import { useEmails } from '../hooks/useEmails';
import type { EmailRow } from '../types';

type Props = {
  readonly clientId: string;
  readonly projectId?: string;
};

type ProjectLite = { id: string; name: string };

export function EmailsTab({ clientId, projectId }: Props) {
  const { emails, loading, error, reload } = useEmails({ clientId, projectId });
  const [showAdd, setShowAdd] = useState(false);
  const [projects, setProjects] = useState<readonly ProjectLite[]>([]);

  useEffect(() => {
    if (projectId) return;
    (async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .eq('client_id', clientId)
        .order('name');
      setProjects(((data ?? []) as ProjectLite[]));
    })();
  }, [clientId, projectId]);

  const threaded = useMemo(() => groupByThread(emails), [emails]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="clay-label">EMAILS</div>
          <p className="clay-mono mt-0.5 text-[11px] text-charcoal-500">
            {emails.length} message{emails.length === 1 ? '' : 's'}
            {threaded.length !== emails.length ? ` · ${threaded.length} thread${threaded.length === 1 ? '' : 's'}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="clay-btn clay-btn-secondary flex items-center gap-1.5 text-sm"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add email
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : error ? (
        <div className="rounded-[12px] border border-pomegranate-400 bg-pomegranate-300/20 p-4">
          <p className="text-sm text-pomegranate-600">{error}</p>
        </div>
      ) : threaded.length === 0 ? (
        <div className="clay-card-dashed relative flex flex-col items-center justify-center overflow-hidden py-12">
          <div className="clay-hatch absolute inset-0 opacity-40" />
          <div
            className="relative mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] border-[1.5px] border-black bg-lemon-500 shadow-[var(--shadow-hard-sm)]"
            style={{ transform: 'rotate(-6deg)' }}
          >
            <svg className="h-6 w-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="relative text-base font-semibold text-black">No emails yet</h3>
          <p className="relative mt-1 max-w-sm text-center text-sm text-charcoal-500">
            Emails from this {projectId ? 'project' : 'client'} will appear here automatically once Gmail is connected. You can also paste one manually.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threaded.map((thread) => (
            <div key={thread.threadKey}>
              {thread.messages.length > 1 && (
                <div className="clay-label mb-1 pl-1">
                  thread · {thread.messages.length} messages
                </div>
              )}
              <div className="space-y-2">
                {thread.messages.map((msg) => (
                  <EmailCard key={msg.id} email={msg} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <ManualEmailForm
          clientId={clientId}
          projectId={projectId ?? null}
          projectsForClient={projects}
          onSaved={() => { setShowAdd(false); reload(); }}
          onCancel={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

type Thread = { threadKey: string; messages: EmailRow[] };

function groupByThread(emails: readonly EmailRow[]): Thread[] {
  const map = new Map<string, EmailRow[]>();
  for (const email of emails) {
    const key = email.gmail_thread_id ?? `solo:${email.id}`;
    const bucket = map.get(key) ?? [];
    bucket.push(email);
    map.set(key, bucket);
  }
  const threads: Thread[] = [];
  for (const [key, msgs] of map) {
    msgs.sort((a, b) => (b.sent_at ?? '').localeCompare(a.sent_at ?? ''));
    threads.push({ threadKey: key, messages: msgs });
  }
  threads.sort((a, b) => (b.messages[0].sent_at ?? '').localeCompare(a.messages[0].sent_at ?? ''));
  return threads;
}
