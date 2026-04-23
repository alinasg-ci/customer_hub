import { describe, it, expect } from 'vitest';
import {
  matchRules,
  UNROUTED,
  type ClientRef,
  type LearnedRule,
} from '@/modules/email/api/routing';

function client(id: string, overrides: Partial<ClientRef> = {}): ClientRef {
  return {
    id,
    name: overrides.name ?? `Client ${id}`,
    company: overrides.company ?? null,
    email_domains: overrides.email_domains ?? [],
    contact_emails: overrides.contact_emails ?? [],
    ...overrides,
  };
}

describe('matchRules', () => {
  it('returns UNROUTED when no clients match', () => {
    const result = matchRules(
      { from_email: 'stranger@nowhere.example', subject: 'hi', snippet: null },
      [],
      [],
    );
    expect(result).toEqual(UNROUTED);
  });

  it('layer 1: matches on client email_domains with full confidence', () => {
    const clients = [client('acme', { email_domains: ['acme.com'] })];
    const result = matchRules(
      { from_email: 'alice@acme.com', subject: null, snippet: null },
      clients,
      [],
    );
    expect(result.client_id).toBe('acme');
    expect(result.routing_source).toBe('domain');
    expect(result.routing_confidence).toBe(1.0);
  });

  it('layer 1: strips leading @ on stored domain values', () => {
    const clients = [client('acme', { email_domains: ['@acme.com'] })];
    const result = matchRules(
      { from_email: 'alice@acme.com', subject: null, snippet: null },
      clients,
      [],
    );
    expect(result.client_id).toBe('acme');
  });

  it('layer 2: matches on client contact_emails (beats fuzzy layer 4)', () => {
    const clients = [
      client('acme', { name: 'Acme Corp', contact_emails: ['alice@work.com'] }),
      client('wayne', { name: 'Wayne Acme', email_domains: [] }),
    ];
    const result = matchRules(
      { from_email: 'alice@work.com', subject: 'Acme project update', snippet: null },
      clients,
      [],
    );
    expect(result.client_id).toBe('acme');
    expect(result.routing_source).toBe('contact');
  });

  it('layer 3: learned rule beats layer 4 fuzzy name match', () => {
    const clients = [
      client('acme', { name: 'Acme Corp' }),
      client('stripe', { name: 'Stripe Inc' }),
    ];
    const rules: LearnedRule[] = [
      { rule_type: 'domain', pattern: 'contractor.com', client_id: 'stripe', project_id: null },
    ];
    const result = matchRules(
      { from_email: 'pm@contractor.com', subject: 'Acme newsletter', snippet: null },
      clients,
      rules,
    );
    expect(result.client_id).toBe('stripe');
    expect(result.routing_source).toBe('learned_rule');
  });

  it('layer 4: matches client name in subject with lower confidence', () => {
    const clients = [client('acme', { name: 'Acme Corp' })];
    const result = matchRules(
      { from_email: 'random@example.com', subject: 'Notes from Acme Corp meeting', snippet: null },
      clients,
      [],
    );
    expect(result.client_id).toBe('acme');
    expect(result.routing_source).toBe('client_name');
    expect(result.routing_confidence).toBeLessThan(1.0);
  });

  it('layer 4: skips short names (<3 chars) to avoid false positives', () => {
    const clients = [client('ab', { name: 'AB' })];
    const result = matchRules(
      { from_email: 'x@y.com', subject: 'The grab bag', snippet: null },
      clients,
      [],
    );
    expect(result.routing_source).toBe('unrouted');
  });

  it('matches sender_email rule exactly', () => {
    const clients = [client('acme'), client('wayne')];
    const rules: LearnedRule[] = [
      { rule_type: 'sender_email', pattern: 'alice@mail.com', client_id: 'wayne', project_id: null },
    ];
    const result = matchRules(
      { from_email: 'alice@mail.com', subject: null, snippet: null },
      clients,
      rules,
    );
    expect(result.client_id).toBe('wayne');
    expect(result.routing_source).toBe('learned_rule');
  });

  it('matches body_keyword rule on snippet', () => {
    const clients = [client('acme'), client('newco')];
    const rules: LearnedRule[] = [
      { rule_type: 'body_keyword', pattern: 'project orion', client_id: 'newco', project_id: null },
    ];
    const result = matchRules(
      { from_email: 'x@y.com', subject: null, snippet: 'Update on project Orion next steps' },
      clients,
      rules,
    );
    expect(result.client_id).toBe('newco');
    expect(result.routing_source).toBe('learned_rule');
  });

  it('is case-insensitive for all layers', () => {
    const clients = [client('acme', { email_domains: ['ACME.com'] })];
    const result = matchRules(
      { from_email: 'Alice@Acme.com', subject: null, snippet: null },
      clients,
      [],
    );
    expect(result.client_id).toBe('acme');
  });

  it('returns project_id from learned rule when provided', () => {
    const clients = [client('acme')];
    const rules: LearnedRule[] = [
      { rule_type: 'domain', pattern: 'acme.com', client_id: 'acme', project_id: 'proj-1' },
    ];
    const result = matchRules(
      { from_email: 'alice@acme.com', subject: null, snippet: null },
      clients,
      rules,
    );
    expect(result.project_id).toBe('proj-1');
  });
});
