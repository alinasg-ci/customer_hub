/**
 * POST /api/gmail/sync — triggered by an authenticated user ("Sync now").
 * GET  /api/gmail/sync — triggered by Vercel Cron with CRON_SECRET.
 *
 * For each connected user, pulls new Gmail messages incrementally, runs the
 * routing pipeline (rule chain → Claude fallback), detects hours mentions,
 * persists the email + thread, and creates notifications for unrouted or
 * hours-bearing emails.
 *
 * Logging rule (CRITICAL): never log subject, body, from_name, to/cc, or
 * any email content. Only UUIDs, sender domain, and decision counts.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserFromCookies,
  getServiceClient,
  verifyCronAuth,
  errorResponse,
} from '../lib/auth';
import { getAccessTokenForUser, gmailForToken } from '../lib/gmailClient';
import { fetchNewMessageIds, fetchAndParseMessage } from '@/modules/email/api/gmail';
import { bodyForLLM } from '@/modules/email/api/sanitize';
import { detectHours } from '@/modules/email/api/hoursExtraction';
import { matchRules } from '@/modules/email/api/routing';
import type { RoutingResult } from '@/modules/email/api/routing';
import { classifyEmail } from '@/modules/email/api/claude';
import {
  loadClientsForUser,
  loadLearnedRules,
  loadProjectsByClient,
  persistEmail,
  upsertRoutingNeededNotification,
  createHoursSuggestionNotification,
  markConnectionSynced,
} from '@/modules/email/api/emailsApi';

const MAX_MESSAGES_PER_SYNC = 50;
const LLM_CALLS_PER_SYNC = 25;   // hard cap per run
const FALLBACK_DAYS = 3;

async function syncUser(userId: string): Promise<{
  user_id: string;
  emails_synced: number;
  emails_routed: number;
  routed_via: Record<string, number>;
  hours_suggestions: number;
  error?: string;
}> {
  const supabase = getServiceClient();

  const routedVia: Record<string, number> = {
    domain: 0, contact: 0, client_name: 0, learned_rule: 0, llm: 0, unrouted: 0,
  };
  let emailsSynced = 0;
  let emailsRouted = 0;
  let hoursSuggestions = 0;
  let errorMsg: string | null = null;

  try {
    const token = await getAccessTokenForUser(userId);
    if (!token) {
      return { user_id: userId, emails_synced: 0, emails_routed: 0, routed_via: routedVia, hours_suggestions: 0, error: 'no_connection' };
    }
    const gmail = gmailForToken(token.accessToken);

    const [clients, rules, projectsByClient] = await Promise.all([
      loadClientsForUser(supabase, userId),
      loadLearnedRules(supabase, userId),
      loadProjectsByClient(supabase, userId),
    ]);

    const { messageIds, nextHistoryId } = await fetchNewMessageIds({
      gmail,
      historyId: token.historyId,
      fallbackDays: FALLBACK_DAYS,
      maxMessages: MAX_MESSAGES_PER_SYNC,
    });

    let llmCallsRemaining = LLM_CALLS_PER_SYNC;

    for (const messageId of messageIds) {
      const parsed = await fetchAndParseMessage(gmail, messageId);
      if (!parsed) continue;

      // Layers 1–4: deterministic rules
      let routing: RoutingResult = matchRules(
        { from_email: parsed.from_email, subject: parsed.subject, snippet: parsed.snippet },
        clients,
        rules,
      );

      // Layer 5: LLM fallback (when unrouted or low confidence <0.5)
      let hoursCandidate = detectHours(bodyForLLM({ text: parsed.body_text, html: parsed.body_html }));

      if ((routing.routing_source === 'unrouted' || routing.routing_confidence < 0.5) && llmCallsRemaining > 0) {
        llmCallsRemaining -= 1;
        try {
          const candidateClients = clients.map((c) => ({
            id: c.id,
            name: c.name,
            company: c.company,
            email_domains: c.email_domains,
            contact_emails: c.contact_emails,
            projects: projectsByClient.get(c.id) ?? [],
          }));
          const llm = await classifyEmail({
            fromEmail: parsed.from_email,
            fromName: parsed.from_name,
            subject: parsed.subject,
            sentAt: parsed.sent_at,
            bodyForLLM: bodyForLLM({ text: parsed.body_text, html: parsed.body_html }),
            clients: candidateClients,
          });
          if (llm.client_id) {
            routing = {
              client_id: llm.client_id,
              project_id: llm.project_id,
              routing_source: 'llm',
              routing_confidence: llm.confidence,
              reasoning: llm.reasoning_short,
            };
          }
          // Prefer LLM's hours signal if it confirms more context.
          if (llm.mentions_hours && llm.hours_amount && (!hoursCandidate || llm.hours_amount >= hoursCandidate.amount)) {
            hoursCandidate = {
              amount: llm.hours_amount,
              quote: llm.hours_description ?? hoursCandidate?.quote ?? '',
              source: 'hours',
            };
          }
        } catch {
          // LLM failure is non-fatal — email still lands as unrouted.
        }
      }

      const { inserted, emailId } = await persistEmail({
        supabase,
        userId,
        parsed,
        routing,
        hoursDetected: hoursCandidate && routing.client_id ? {
          amount: hoursCandidate.amount,
          date: null,
          description: hoursCandidate.quote,
          snippet: hoursCandidate.quote,
        } : null,
      });

      if (!inserted || !emailId) continue;
      emailsSynced += 1;
      routedVia[routing.routing_source] = (routedVia[routing.routing_source] ?? 0) + 1;

      if (routing.routing_source === 'unrouted' || !routing.client_id) {
        await upsertRoutingNeededNotification({
          supabase,
          userId,
          emailId,
          threadId: parsed.gmail_thread_id,
          subject: parsed.subject,
          fromEmail: parsed.from_email,
        });
      } else {
        emailsRouted += 1;
      }

      if (hoursCandidate && routing.client_id) {
        await createHoursSuggestionNotification({
          supabase,
          userId,
          emailId,
          projectId: routing.project_id,
          fromEmail: parsed.from_email,
          amount: hoursCandidate.amount,
        });
        hoursSuggestions += 1;
      }
    }

    await markConnectionSynced(supabase, userId, nextHistoryId, null);
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : 'sync_failed';
    await markConnectionSynced(getServiceClient(), userId, null, errorMsg);
  }

  return {
    user_id: userId,
    emails_synced: emailsSynced,
    emails_routed: emailsRouted,
    routed_via: routedVia,
    hours_suggestions: hoursSuggestions,
    error: errorMsg ?? undefined,
  };
}

export async function POST(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user) return errorResponse('UNAUTHORIZED', 'Not signed in', 401);

  const summary = await syncUser(user.id);
  return NextResponse.json({ data: summary, error: summary.error ? { code: 'SYNC_ERROR', message: summary.error, id: 'err_sync' } : null });
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) return errorResponse('UNAUTHORIZED', 'Invalid cron auth', 401);

  const supabase = getServiceClient();
  const { data: rows } = await supabase
    .from('gmail_connections')
    .select('user_id');
  const userIds = (rows ?? []).map((r) => (r as { user_id: string }).user_id);

  const summaries = [];
  for (const uid of userIds) {
    summaries.push(await syncUser(uid));
  }

  return NextResponse.json({ data: { users: summaries.length, summaries }, error: null });
}
