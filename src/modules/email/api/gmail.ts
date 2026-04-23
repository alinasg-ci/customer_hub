/**
 * Gmail fetch + parse. Converts the wire format into the flat `ParsedEmail`
 * shape used throughout the pipeline.
 *
 * Incremental-sync strategy:
 *   - If we have a stored historyId: call users.history.list.
 *   - If the window expired (HTTP 404 on historyId): fall back to a bounded
 *     messages.list query for the last 3 days.
 */

import { gmail_v1 } from 'googleapis';

export type ParsedEmail = {
  readonly gmail_message_id: string;
  readonly gmail_thread_id: string;
  readonly from_email: string;
  readonly from_name: string | null;
  readonly to_emails: readonly string[];
  readonly cc_emails: readonly string[];
  readonly subject: string | null;
  readonly snippet: string | null;
  readonly body_text: string | null;
  readonly body_html: string | null;
  readonly sent_at: string | null;
};

export async function fetchNewMessageIds(params: {
  readonly gmail: gmail_v1.Gmail;
  readonly historyId: string | null;
  readonly fallbackDays: number;
  readonly maxMessages: number;
}): Promise<{ messageIds: string[]; nextHistoryId: string | null }> {
  const { gmail, historyId, fallbackDays, maxMessages } = params;

  if (historyId) {
    try {
      const history = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: historyId,
        historyTypes: ['messageAdded'],
        maxResults: maxMessages,
      });
      const ids = new Set<string>();
      for (const h of history.data.history ?? []) {
        for (const added of h.messagesAdded ?? []) {
          if (added.message?.id) ids.add(added.message.id);
        }
      }
      return {
        messageIds: Array.from(ids),
        nextHistoryId: history.data.historyId ?? historyId,
      };
    } catch (err: unknown) {
      const status = (err as { code?: number; status?: number }).code
        ?? (err as { code?: number; status?: number }).status;
      if (status !== 404) throw err;
      // History window expired — fall through to full-window scan.
    }
  }

  const list = await gmail.users.messages.list({
    userId: 'me',
    q: `newer_than:${fallbackDays}d`,
    maxResults: maxMessages,
  });
  const messageIds = (list.data.messages ?? []).map((m) => m.id!).filter(Boolean);

  // Fetch current historyId from profile so next poll can go incremental.
  const profile = await gmail.users.getProfile({ userId: 'me' });
  return { messageIds, nextHistoryId: profile.data.historyId ?? null };
}

export async function fetchAndParseMessage(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<ParsedEmail | null> {
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });
  const msg = res.data;
  if (!msg.id || !msg.threadId) return null;

  const headers = msg.payload?.headers ?? [];
  const h = (name: string) =>
    headers.find((x) => (x.name ?? '').toLowerCase() === name.toLowerCase())?.value ?? null;

  const fromHeader = h('From') ?? '';
  const { email: fromEmail, name: fromName } = parseAddress(fromHeader);

  return {
    gmail_message_id: msg.id,
    gmail_thread_id: msg.threadId,
    from_email: fromEmail,
    from_name: fromName,
    to_emails: parseAddressList(h('To')),
    cc_emails: parseAddressList(h('Cc')),
    subject: h('Subject'),
    snippet: msg.snippet ?? null,
    body_text: extractBody(msg.payload, 'text/plain'),
    body_html: extractBody(msg.payload, 'text/html'),
    sent_at: h('Date') ? new Date(h('Date')!).toISOString() : null,
  };
}

function parseAddress(raw: string): { email: string; name: string | null } {
  const match = /^\s*(?:"?([^"<]*?)"?\s*)?<?([^<>\s]+@[^<>\s]+)>?/.exec(raw);
  if (!match) return { email: raw.trim(), name: null };
  return { email: match[2].trim().toLowerCase(), name: (match[1] ?? '').trim() || null };
}

function parseAddressList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((p) => parseAddress(p).email)
    .filter(Boolean);
}

function extractBody(payload: gmail_v1.Schema$MessagePart | undefined, mime: string): string | null {
  if (!payload) return null;
  if (payload.mimeType === mime && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  for (const part of payload.parts ?? []) {
    const found = extractBody(part, mime);
    if (found) return found;
  }
  return null;
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}
