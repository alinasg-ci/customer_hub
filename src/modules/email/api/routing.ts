/**
 * Pure routing chain. Given an email's identifying fields + the user's
 * clients + learned rules, resolve the best (client_id, project_id) pair
 * using layered heuristics. Layers short-circuit on first match.
 *
 * Layer order:
 *   1. Domain match (from_email → client.email_domains)          conf 1.0
 *   2. Contact match (from_email → client.contact_emails)        conf 1.0
 *   3. Learned rule  (domain | sender_email | subject | body)    conf 0.9–0.95
 *   4. Client-name fuzzy (client.name/company appears in text)   conf 0.7
 *   5. Fall through → 'unrouted'; LLM layer runs elsewhere.
 */

export type RoutingInput = {
  readonly from_email: string;
  readonly subject: string | null;
  readonly snippet: string | null;
};

export type ClientRef = {
  readonly id: string;
  readonly name: string;
  readonly company: string | null;
  readonly email_domains: readonly string[];
  readonly contact_emails: readonly string[];
};

export type LearnedRule = {
  readonly rule_type: 'domain' | 'sender_email' | 'subject_pattern' | 'body_keyword';
  readonly pattern: string;
  readonly client_id: string;
  readonly project_id: string | null;
};

export type RoutingSource =
  | 'domain' | 'contact' | 'learned_rule' | 'client_name'
  | 'llm' | 'manual' | 'unrouted';

export type RoutingResult = {
  readonly client_id: string | null;
  readonly project_id: string | null;
  readonly routing_source: RoutingSource;
  readonly routing_confidence: number;
  readonly reasoning: string;
};

export const UNROUTED: RoutingResult = {
  client_id: null,
  project_id: null,
  routing_source: 'unrouted',
  routing_confidence: 0,
  reasoning: 'no rule matched',
};

function normalizeDomain(raw: string): string {
  return raw.replace(/^@/, '').trim().toLowerCase();
}

function extractDomain(email: string): string {
  return email.split('@')[1]?.trim().toLowerCase() ?? '';
}

export function matchRules(
  input: RoutingInput,
  clients: readonly ClientRef[],
  rules: readonly LearnedRule[]
): RoutingResult {
  const fromEmail = input.from_email.toLowerCase();
  const domain = extractDomain(fromEmail);
  const subjectLower = (input.subject ?? '').toLowerCase();
  const snippetLower = (input.snippet ?? '').toLowerCase();

  // Layer 1 — domain match
  if (domain) {
    for (const c of clients) {
      if (c.email_domains.some((d) => normalizeDomain(d) === domain)) {
        return {
          client_id: c.id,
          project_id: null,
          routing_source: 'domain',
          routing_confidence: 1.0,
          reasoning: `domain ${domain} matches ${c.name}`,
        };
      }
    }
  }

  // Layer 2 — contact match
  for (const c of clients) {
    if (c.contact_emails.some((e) => e.toLowerCase() === fromEmail)) {
      return {
        client_id: c.id,
        project_id: null,
        routing_source: 'contact',
        routing_confidence: 1.0,
        reasoning: `contact email matches ${c.name}`,
      };
    }
  }

  // Layer 3 — learned rules
  for (const rule of rules) {
    const pattern = rule.pattern.toLowerCase();
    let matched = false;
    if (rule.rule_type === 'domain') matched = !!domain && normalizeDomain(pattern) === domain;
    else if (rule.rule_type === 'sender_email') matched = fromEmail === pattern;
    else if (rule.rule_type === 'subject_pattern') matched = subjectLower.includes(pattern);
    else if (rule.rule_type === 'body_keyword') matched = snippetLower.includes(pattern);

    if (matched) {
      return {
        client_id: rule.client_id,
        project_id: rule.project_id,
        routing_source: 'learned_rule',
        routing_confidence: rule.rule_type === 'domain' || rule.rule_type === 'sender_email' ? 0.95 : 0.9,
        reasoning: `learned rule (${rule.rule_type}=${rule.pattern})`,
      };
    }
  }

  // Layer 4 — client-name fuzzy (short names guarded against false positives)
  for (const c of clients) {
    const candidates = [c.name, c.company].filter((n): n is string => !!n);
    for (const raw of candidates) {
      const name = raw.toLowerCase();
      if (name.length < 3) continue;
      if (subjectLower.includes(name) || snippetLower.includes(name)) {
        return {
          client_id: c.id,
          project_id: null,
          routing_source: 'client_name',
          routing_confidence: 0.7,
          reasoning: `"${raw}" appears in subject/snippet`,
        };
      }
    }
  }

  return UNROUTED;
}
