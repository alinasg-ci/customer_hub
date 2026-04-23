/**
 * Pure hours-mention detection. Cheap regex first pass; the LLM confirms
 * context. Returns a candidate amount + short quote snippet when one is
 * found, null otherwise. Never mutates input.
 */

const HOURS_RE = /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/gi;
const MINUTES_RE = /(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/gi;

export type HoursCandidate = {
  readonly amount: number;
  readonly quote: string;
  readonly source: 'hours' | 'minutes';
};

/**
 * Scan a body for the strongest hours/minutes mention. Returns the biggest
 * plausible value (0 < amount < 24 for hours, converted for minutes) plus a
 * ±60-char quote around the match for the user's audit trail.
 */
export function detectHours(body: string): HoursCandidate | null {
  if (!body) return null;
  const candidates: HoursCandidate[] = [];

  for (const m of body.matchAll(HOURS_RE)) {
    const amount = Number(m[1]);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 24) continue;
    const idx = m.index ?? 0;
    candidates.push({
      amount,
      quote: quoteAround(body, idx, m[0].length),
      source: 'hours',
    });
  }

  for (const m of body.matchAll(MINUTES_RE)) {
    const minutes = Number(m[1]);
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 24 * 60) continue;
    const amount = Number((minutes / 60).toFixed(2));
    if (amount < 0.1 || amount > 24) continue;
    const idx = m.index ?? 0;
    candidates.push({
      amount,
      quote: quoteAround(body, idx, m[0].length),
      source: 'minutes',
    });
  }

  if (candidates.length === 0) return null;
  // Prefer the largest magnitude — usually the clearest signal.
  candidates.sort((a, b) => b.amount - a.amount);
  return candidates[0];
}

function quoteAround(body: string, start: number, length: number): string {
  const windowSize = 60;
  const s = Math.max(0, start - windowSize);
  const e = Math.min(body.length, start + length + windowSize);
  const snippet = body.slice(s, e).replace(/\s+/g, ' ').trim();
  return (s > 0 ? '…' : '') + snippet + (e < body.length ? '…' : '');
}
