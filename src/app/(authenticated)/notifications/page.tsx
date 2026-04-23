'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/shared/hooks/useSupabase';
import { useNotifications } from '@/modules/notifications';
import { Skeleton } from '@/shared/ui/Skeleton';
import { cn } from '@/shared/utils/cn';
import type { Notification } from '@/modules/notifications';

type ClientLite = { id: string; name: string; company: string | null };
type ProjectLite = { id: string; name: string; client_id: string };
type EmailLite = {
  id: string;
  gmail_thread_id: string | null;
  from_email: string;
  subject: string | null;
  snippet: string | null;
  sent_at: string | null;
  mentions_hours: boolean;
  hours_suggestion_amount: number | null;
};

const TYPE_TINT: Record<Notification['type'], { label: string; tint: string }> = {
  over_budget_warning:    { label: 'budget warning',   tint: 'bg-lemon-400/30 text-lemon-800 border-lemon-700' },
  over_budget_exceeded:   { label: 'budget exceeded',  tint: 'bg-pomegranate-300/30 text-pomegranate-700 border-pomegranate-400' },
  bank_depleting:         { label: 'bank depleting',   tint: 'bg-lemon-400/30 text-lemon-800 border-lemon-700' },
  bank_depleted:          { label: 'bank depleted',    tint: 'bg-pomegranate-300/30 text-pomegranate-700 border-pomegranate-400' },
  deadline_approaching:   { label: 'deadline near',    tint: 'bg-lemon-400/30 text-lemon-800 border-lemon-700' },
  deadline_overdue:       { label: 'deadline overdue', tint: 'bg-pomegranate-300/30 text-pomegranate-700 border-pomegranate-400' },
  email_routing_needed:   { label: 'email · route',    tint: 'bg-ube-300/40 text-ube-900 border-ube-500' },
  email_hours_suggestion: { label: 'email · hours',    tint: 'bg-lemon-400/30 text-lemon-800 border-lemon-700' },
};

export default function NotificationsPage() {
  const { notifications, loading, error, read, readAll, reload } = useNotifications();
  const [clients, setClients] = useState<readonly ClientLite[]>([]);
  const [projects, setProjects] = useState<readonly ProjectLite[]>([]);
  const [emailsById, setEmailsById] = useState<ReadonlyMap<string, EmailLite>>(new Map());

  const emailNotifications = useMemo(
    () => notifications.filter((n) => n.email_id),
    [notifications]
  );

  // Load supporting data used by the table (clients, projects, and the
  // email snapshots referenced by notifications).
  useEffect(() => {
    (async () => {
      const [{ data: cs }, { data: ps }] = await Promise.all([
        supabase.from('clients').select('id, name, company').neq('status', 'archived').order('name'),
        supabase.from('projects').select('id, name, client_id').neq('status', 'closed').order('name'),
      ]);
      setClients((cs ?? []) as ClientLite[]);
      setProjects((ps ?? []) as ProjectLite[]);
    })();
  }, []);

  useEffect(() => {
    const emailIds = Array.from(new Set(emailNotifications.map((n) => n.email_id!).filter(Boolean)));
    if (emailIds.length === 0) { setEmailsById(new Map()); return; }
    (async () => {
      const { data } = await supabase
        .from('emails')
        .select('id, gmail_thread_id, from_email, subject, snippet, sent_at, mentions_hours, hours_suggestion_amount')
        .in('id', emailIds);
      const map = new Map<string, EmailLite>();
      for (const row of (data ?? []) as EmailLite[]) map.set(row.id, row);
      setEmailsById(map);
    })();
  }, [emailNotifications]);

  const projectsByClient = useMemo(() => {
    const m = new Map<string, ProjectLite[]>();
    for (const p of projects) {
      const arr = m.get(p.client_id) ?? [];
      arr.push(p);
      m.set(p.client_id, arr);
    }
    return m;
  }, [projects]);

  const handleAssign = useCallback(async (notif: Notification, clientId: string | null, projectId: string | null) => {
    if (!notif.email_id) return;
    const email = emailsById.get(notif.email_id);
    const targetThreadId = email?.gmail_thread_id;
    const newSource = clientId ? 'manual' : 'unrouted';

    // Update the email (and every other message in the thread) + resolve
    // the notification. Routing rule learning happens in a follow-up prompt.
    const emails = supabase.from('emails') as any;
    if (targetThreadId) {
      await emails
        .update({ client_id: clientId, project_id: projectId, routing_source: newSource, routing_confidence: 1.0 })
        .eq('gmail_thread_id', targetThreadId);
    } else {
      await emails
        .update({ client_id: clientId, project_id: projectId, routing_source: newSource, routing_confidence: 1.0 })
        .eq('id', notif.email_id);
    }

    await read(notif.id);

    // Suggest a learned rule for this sender's domain.
    if (clientId && email) {
      const domain = email.from_email.split('@')[1];
      if (domain && typeof window !== 'undefined') {
        const targetClient = clients.find((c) => c.id === clientId);
        const approve = window.confirm(
          `Always route emails from @${domain} to ${targetClient?.name ?? 'this client'}?`
        );
        if (approve) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await (supabase.from('email_routing_rules') as any).upsert(
              {
                user_id: user.id,
                rule_type: 'domain',
                pattern: domain,
                client_id: clientId,
                project_id: projectId,
                source: 'learned_from_correction',
              },
              { onConflict: 'user_id,rule_type,pattern' }
            );
          }
        }
      }
    }

    reload();
  }, [emailsById, clients, read, reload]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const unroutedCount = emailNotifications.filter((n) => n.type === 'email_routing_needed' && !n.is_read).length;

  return (
    <div>
      {/* Hero */}
      <section className="relative mb-8">
        <div className="clay-label">INBOX · TRIAGE</div>
        <h1
          className="my-2 font-semibold text-black"
          style={{
            fontSize: 'clamp(44px, 6vw, 72px)',
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            fontFeatureSettings: '"ss01","ss03"',
          }}
        >
          Your <em className="not-italic text-slushie-500">notifications</em>.
        </h1>
        <p className="clay-mono mt-2 text-[13px] text-charcoal-500">
          {unreadCount} unread · {unroutedCount} email{unroutedCount === 1 ? '' : 's'} to route
        </p>
        {unreadCount > 0 && (
          <div className="clay-sticker absolute right-2 top-2 hidden sm:inline-flex" style={{ transform: 'rotate(-6deg)' }}>
            ★ {unreadCount}
          </div>
        )}
      </section>

      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => readAll()}
          disabled={unreadCount === 0}
          className="clay-btn clay-btn-secondary text-sm disabled:opacity-50"
        >
          Mark all read
        </button>
      </div>

      <div className="clay-card-static overflow-hidden">
        <div className="h-[6px] bg-slushie-500" />

        {loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="p-5">
            <p className="text-sm text-pomegranate-600">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-charcoal-500">No notifications right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream-dark text-left">
                  <th className="clay-label clay-mono py-3 pl-5 pr-2">Type</th>
                  <th className="clay-label clay-mono py-3 px-3">Subject / message</th>
                  <th className="clay-label clay-mono py-3 px-3">From / context</th>
                  <th className="clay-label clay-mono py-3 px-3">Received</th>
                  <th className="clay-label clay-mono py-3 px-3">Assign client</th>
                  <th className="clay-label clay-mono py-3 px-3">Project</th>
                  <th className="clay-label clay-mono w-24 py-3 pr-5"></th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => {
                  const tint = TYPE_TINT[n.type] ?? TYPE_TINT.email_routing_needed;
                  const email = n.email_id ? emailsById.get(n.email_id) : undefined;
                  const clientId = email?.gmail_thread_id
                    ? null  // routed via thread update
                    : null;
                  return (
                    <tr key={n.id} className={cn('border-b border-oat-200 last:border-0', n.is_read && 'opacity-60')}>
                      <td className="py-3 pl-5 pr-2">
                        <span className={cn('rounded-md border px-1.5 py-0.5 text-[11px] font-medium', tint.tint)}>
                          {tint.label}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="max-w-[280px] truncate text-black">
                          {email?.subject || n.message}
                        </div>
                        {email?.snippet && (
                          <div className="mt-0.5 line-clamp-1 max-w-[280px] text-[12px] text-charcoal-500">
                            {email.snippet}
                          </div>
                        )}
                      </td>
                      <td className="clay-mono py-3 px-3 text-[12px] text-charcoal-500">
                        {email?.from_email ?? '—'}
                      </td>
                      <td className="clay-mono py-3 px-3 text-[11px] text-charcoal-500">
                        {email?.sent_at
                          ? new Date(email.sent_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                          : new Date(n.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="py-3 px-3">
                        {n.email_id ? (
                          <ClientAssignSelect
                            clients={clients}
                            value={clientId}
                            onChange={(cid) => handleAssign(n, cid, null)}
                          />
                        ) : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {n.email_id ? (
                          <ProjectAssignSelect
                            projects={projects}
                            value={null}
                            onChange={(pid) => handleAssign(n, pid ? projects.find((p) => p.id === pid)?.client_id ?? null : null, pid)}
                          />
                        ) : '—'}
                      </td>
                      <td className="py-3 pr-5 text-right">
                        {n.type === 'email_hours_suggestion' && n.email_id ? (
                          <Link
                            href={`/client/${clients.find(() => true)?.id ?? ''}`}
                            className="clay-btn clay-btn-primary text-[12px]"
                          >
                            Review
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => read(n.id)}
                            className="clay-btn clay-btn-secondary text-[12px]"
                            disabled={n.is_read}
                          >
                            {n.is_read ? 'Done' : 'Mark done'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ClientAssignSelect({
  clients,
  value,
  onChange,
}: {
  readonly clients: readonly ClientLite[];
  readonly value: string | null;
  readonly onChange: (clientId: string | null) => void;
}) {
  return (
    <select
      className="clay-input text-xs"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">— choose —</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
      ))}
    </select>
  );
}

function ProjectAssignSelect({
  projects,
  value,
  onChange,
}: {
  readonly projects: readonly ProjectLite[];
  readonly value: string | null;
  readonly onChange: (projectId: string | null) => void;
}) {
  return (
    <select
      className="clay-input text-xs"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">(none)</option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}
