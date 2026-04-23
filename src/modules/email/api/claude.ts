/**
 * Claude Haiku fallback for emails the deterministic rule chain could not
 * route (or routed with low confidence). Uses Anthropic tool-use to force a
 * strict JSON shape — the LLM cannot free-text.
 *
 * Security:
 *   - Server-side only (lives inside src/app/api); the key never ships to
 *     the browser.
 *   - Body is sanitized + truncated before it gets here (see sanitize.ts).
 *   - Per-user rate limits enforced by the sync route.
 */

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-haiku-4-5-20251001';

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');
  client = new Anthropic({ apiKey });
  return client;
}

export type LlmClient = {
  readonly id: string;
  readonly name: string;
  readonly company: string | null;
  readonly email_domains: readonly string[];
  readonly contact_emails: readonly string[];
  readonly projects: readonly { readonly id: string; readonly name: string; readonly type: string }[];
};

export type LlmInput = {
  readonly fromEmail: string;
  readonly fromName: string | null;
  readonly subject: string | null;
  readonly sentAt: string | null;
  readonly bodyForLLM: string;
  readonly clients: readonly LlmClient[];
};

export type LlmClassification = {
  readonly client_id: string | null;
  readonly project_id: string | null;
  readonly confidence: number;
  readonly reasoning_short: string;
  readonly mentions_hours: boolean;
  readonly hours_amount: number | null;
  readonly hours_date: string | null;
  readonly hours_description: string | null;
  readonly is_thread_continuation: boolean;
};

const CLASSIFY_TOOL = {
  name: 'submit_classification',
  description: 'Return the routing + hours analysis for this email.',
  input_schema: {
    type: 'object' as const,
    required: [
      'client_id', 'project_id', 'confidence', 'reasoning_short',
      'mentions_hours', 'hours_amount', 'hours_date',
      'hours_description', 'is_thread_continuation',
    ],
    properties: {
      client_id:   { type: ['string', 'null'], description: 'UUID from candidate clients, or null.' },
      project_id:  { type: ['string', 'null'], description: 'UUID from the chosen client\'s projects, or null.' },
      confidence:  { type: 'number', minimum: 0, maximum: 1 },
      reasoning_short: { type: 'string', maxLength: 140 },
      mentions_hours: { type: 'boolean' },
      hours_amount:   { type: ['number', 'null'], description: 'Decimal hours worked, or null.' },
      hours_date:     { type: ['string', 'null'], description: 'ISO date YYYY-MM-DD if stated, else null.' },
      hours_description: { type: ['string', 'null'], description: 'Short quote describing the work.' },
      is_thread_continuation: { type: 'boolean', description: 'True if the email replies to an earlier thread.' },
    },
    additionalProperties: false,
  },
};

const SYSTEM_PROMPT = `You classify an incoming email for a freelance consultant.
Decide (a) which client and project it belongs to — pick from the provided list or return null — and (b) whether it mentions hours the consultant worked on that project.

Rules:
- Only pick a client_id that appears in the provided list. Never invent UUIDs.
- If the email is promotional, automated, calendar invite, or clearly unrelated to client work, set client_id to null and confidence low.
- project_id is optional even when client_id is set; only pick one if the email references a specific project.
- If it mentions hours worked, extract the decimal amount (e.g. "2 hours and 30 minutes" → 2.5). Use null if the amount is vague or generic ("some hours").
- reasoning_short must be ≤120 characters and must not quote large body excerpts — it is an audit trail, not a summary.
- Confidence is your overall certainty in client_id; set to 0 if client_id is null.`;

function buildUserMessage(input: LlmInput): string {
  const clientsBlock = input.clients
    .map((c) => {
      const projects = c.projects.map((p) => `    · ${p.id}  ${p.name}  (${p.type})`).join('\n');
      return [
        `- id: ${c.id}`,
        `  name: ${c.name}`,
        c.company ? `  company: ${c.company}` : undefined,
        c.email_domains.length ? `  domains: ${c.email_domains.join(', ')}` : undefined,
        c.contact_emails.length ? `  contacts: ${c.contact_emails.join(', ')}` : undefined,
        c.projects.length ? `  projects:\n${projects}` : undefined,
      ].filter(Boolean).join('\n');
    })
    .join('\n');

  return [
    '<candidate_clients>',
    clientsBlock || '(none)',
    '</candidate_clients>',
    '',
    '<email>',
    `From: ${input.fromName ? `${input.fromName} <${input.fromEmail}>` : input.fromEmail}`,
    `Subject: ${input.subject ?? '(no subject)'}`,
    input.sentAt ? `Date: ${input.sentAt}` : '',
    '',
    input.bodyForLLM || '(empty body)',
    '</email>',
  ].filter(Boolean).join('\n');
}

export async function classifyEmail(input: LlmInput): Promise<LlmClassification> {
  const anthropic = getClient();

  // Prompt cache on the candidate-clients block since it's stable across
  // many emails in a single sync tick.
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 500,
    temperature: 0,
    system: SYSTEM_PROMPT,
    tools: [CLASSIFY_TOOL],
    tool_choice: { type: 'tool', name: 'submit_classification' },
    messages: [
      { role: 'user', content: buildUserMessage(input) },
    ],
  });

  const toolUse = msg.content.find((c) => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a tool_use response');
  }
  const raw = toolUse.input as LlmClassification;

  // Validate client_id / project_id against the provided candidate list.
  const validClient = raw.client_id
    ? input.clients.find((c) => c.id === raw.client_id) ?? null
    : null;
  const validProject = validClient && raw.project_id
    ? validClient.projects.find((p) => p.id === raw.project_id) ?? null
    : null;

  return {
    client_id: validClient?.id ?? null,
    project_id: validProject?.id ?? null,
    confidence: validClient ? Math.max(0, Math.min(1, raw.confidence ?? 0)) : 0,
    reasoning_short: (raw.reasoning_short ?? '').slice(0, 140),
    mentions_hours: !!raw.mentions_hours,
    hours_amount: typeof raw.hours_amount === 'number' && raw.hours_amount > 0 ? raw.hours_amount : null,
    hours_date: raw.hours_date ?? null,
    hours_description: raw.hours_description ?? null,
    is_thread_continuation: !!raw.is_thread_continuation,
  };
}
