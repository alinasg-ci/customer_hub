/**
 * Supabase persistence helpers for the email ingestion pipeline.
 *
 * All functions accept a pre-built service-role Supabase client. Callers
 * are responsible for scoping inserts by user_id.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { encryptWith } from '@/shared/utils/crypto';
import type { ParsedEmail } from './gmail';
import type { ClientRef, LearnedRule, RoutingResult } from './routing';

const EMAIL_KEY_ENV = 'EMAIL_ENCRYPTION_KEY';

type SupabaseAny = SupabaseClient;

export async function loadClientsForUser(supabase: SupabaseAny, userId: string): Promise<ClientRef[]> {
  const { data } = await supabase
    .from('clients')
    .select('id, name, company, email_domains, contact_emails, status')
    .eq('user_id', userId)
    .neq('status', 'archived');
  return ((data ?? []) as Array<{
    id: string;
    name: string;
    company: string | null;
    email_domains: string[] | null;
    contact_emails: string[] | null;
  }>).map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    email_domains: c.email_domains ?? [],
    contact_emails: c.contact_emails ?? [],
  }));
}

export async function loadLearnedRules(supabase: SupabaseAny, userId: string): Promise<LearnedRule[]> {
  const { data } = await supabase
    .from('email_routing_rules')
    .select('rule_type, pattern, client_id, project_id')
    .eq('user_id', userId);
  return (data ?? []) as LearnedRule[];
}

export async function loadProjectsByClient(
  supabase: SupabaseAny,
  userId: string
): Promise<Map<string, Array<{ id: string; name: string; type: string }>>> {
  const { data } = await supabase
    .from('projects')
    .select('id, name, type, client_id')
    .eq('user_id', userId)
    .neq('status', 'closed');
  const map = new Map<string, Array<{ id: string; name: string; type: string }>>();
  for (const row of (data ?? []) as Array<{ id: string; name: string; type: string; client_id: string }>) {
    const bucket = map.get(row.client_id) ?? [];
    bucket.push({ id: row.id, name: row.name, type: row.type });
    map.set(row.client_id, bucket);
  }
  return map;
}

/**
 * Upsert email_threads + insert/update emails row in a single transaction-ish flow.
 * Returns true if the email was newly inserted, false if it already existed.
 */
export async function persistEmail(params: {
  supabase: SupabaseAny;
  userId: string;
  parsed: ParsedEmail;
  routing: RoutingResult;
  hoursDetected: null | {
    amount: number;
    date: string | null;
    description: string | null;
    snippet: string | null;
  };
}): Promise<{ inserted: boolean; emailId: string | null }> {
  const { supabase, userId, parsed, routing, hoursDetected } = params;

  // Check for existing email by gmail_message_id (unique per user).
  const { data: existing } = await supabase
    .from('emails')
    .select('id')
    .eq('user_id', userId)
    .eq('gmail_message_id', parsed.gmail_message_id)
    .maybeSingle();

  if (existing) {
    return { inserted: false, emailId: (existing as { id: string }).id };
  }

  // Upsert thread record (idempotent).
  await (supabase.from('email_threads') as any).upsert(
    {
      gmail_thread_id: parsed.gmail_thread_id,
      user_id: userId,
      subject: parsed.subject,
      last_message_at: parsed.sent_at,
      client_id: routing.client_id,
      project_id: routing.project_id,
    },
    { onConflict: 'gmail_thread_id' }
  );

  const body_encrypted = parsed.body_text || parsed.body_html
    ? encryptWith(EMAIL_KEY_ENV, parsed.body_text || parsed.body_html || '')
    : null;

  const { data: inserted, error } = await (supabase.from('emails') as any)
    .insert({
      user_id: userId,
      gmail_message_id: parsed.gmail_message_id,
      gmail_thread_id: parsed.gmail_thread_id,
      from_email: parsed.from_email,
      from_name: parsed.from_name,
      to_emails: parsed.to_emails,
      cc_emails: parsed.cc_emails,
      subject: parsed.subject,
      snippet: parsed.snippet,
      body_encrypted,
      sent_at: parsed.sent_at,
      client_id: routing.client_id,
      project_id: routing.project_id,
      routing_source: routing.routing_source,
      routing_confidence: routing.routing_confidence,
      routing_reasoning: routing.reasoning,
      mentions_hours: !!hoursDetected,
      hours_suggestion_amount: hoursDetected?.amount ?? null,
      hours_suggestion_date: hoursDetected?.date ?? null,
      hours_suggestion_description: hoursDetected?.description ?? null,
      hours_suggestion_snippet: hoursDetected?.snippet ?? null,
    })
    .select('id')
    .single();

  if (error) return { inserted: false, emailId: null };

  return { inserted: true, emailId: (inserted as { id: string }).id };
}

/**
 * Create (deduped per thread) a notification prompting the user to route an
 * unrouted email.
 */
export async function upsertRoutingNeededNotification(params: {
  supabase: SupabaseAny;
  userId: string;
  emailId: string;
  threadId: string;
  subject: string | null;
  fromEmail: string;
}): Promise<void> {
  const { supabase, userId, emailId, threadId, subject, fromEmail } = params;

  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'email_routing_needed')
    .eq('link', `thread:${threadId}`)
    .eq('is_read', false)
    .maybeSingle();

  if (existing) return;

  await (supabase.from('notifications') as any).insert({
    user_id: userId,
    type: 'email_routing_needed',
    email_id: emailId,
    message: `Email from ${fromEmail}${subject ? ` — "${subject}"` : ''} needs a client`,
    link: `thread:${threadId}`,
    is_read: false,
  });
}

export async function createHoursSuggestionNotification(params: {
  supabase: SupabaseAny;
  userId: string;
  emailId: string;
  projectId: string | null;
  fromEmail: string;
  amount: number;
}): Promise<void> {
  const { supabase, userId, emailId, projectId, fromEmail, amount } = params;
  await (supabase.from('notifications') as any).insert({
    user_id: userId,
    type: 'email_hours_suggestion',
    email_id: emailId,
    project_id: projectId,
    message: `Email from ${fromEmail} mentions ~${amount.toFixed(1)}h`,
    link: `email:${emailId}`,
    is_read: false,
  });
}

export async function markConnectionSynced(
  supabase: SupabaseAny,
  userId: string,
  historyId: string | null,
  errorMessage: string | null = null,
): Promise<void> {
  await (supabase.from('gmail_connections') as any)
    .update({
      history_id: historyId,
      last_sync_at: new Date().toISOString(),
      last_error: errorMessage,
    })
    .eq('user_id', userId);
}
