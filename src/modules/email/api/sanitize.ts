/**
 * Pure helpers for preparing raw email content for storage + LLM input.
 *
 * Security posture:
 *  - Strip <script>/<style> blocks and tracking pixels before any display / LLM call.
 *  - Normalize HTML to plain text for classification.
 *  - Truncate body to LLM_BODY_MAX characters.
 *  - Never include raw headers that could leak other contacts.
 */

export const LLM_BODY_MAX = 4000;

const TRACKER_HOSTS = [
  'mailtrack', 'mailchimp', 'intercom', 'hubspot', 'sendgrid',
  'amazonses', 'mandrill', 'postmark', 'mixpanel', 'segment',
];

const BLOCK_TAGS = ['script', 'style', 'noscript', 'iframe', 'object', 'embed', 'svg'];

export function stripBlockTags(html: string): string {
  let out = html;
  for (const tag of BLOCK_TAGS) {
    const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, 'gi');
    out = out.replace(re, ' ');
  }
  return out;
}

export function stripTrackingPixels(html: string): string {
  // Remove <img> tags whose src contains any known tracker substring.
  return html.replace(/<img\b[^>]*>/gi, (match) => {
    const src = /src=["']([^"']+)["']/i.exec(match)?.[1]?.toLowerCase() ?? '';
    if (!src) return '';
    if (TRACKER_HOSTS.some((host) => src.includes(host))) return '';
    // Also drop 1x1 pixels if width/height attrs reveal them.
    if (/width=["']?1\b/i.test(match) && /height=["']?1\b/i.test(match)) return '';
    return match;
  });
}

export function htmlToPlainText(html: string): string {
  const cleaned = stripTrackingPixels(stripBlockTags(html));
  return cleaned
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Decide the best text body to feed the LLM from what Gmail returned.
 */
export function bodyForLLM(params: {
  readonly text?: string | null;
  readonly html?: string | null;
}): string {
  const raw = params.text?.trim() || (params.html ? htmlToPlainText(params.html) : '');
  if (!raw) return '';
  return raw.length > LLM_BODY_MAX ? `${raw.slice(0, LLM_BODY_MAX)}…` : raw;
}

export function headerDigest(params: {
  readonly from_email: string;
  readonly from_name: string | null;
  readonly subject: string | null;
  readonly sent_at: string | null;
}): string {
  const parts: string[] = [];
  if (params.from_name) parts.push(`From: ${params.from_name} <${params.from_email}>`);
  else parts.push(`From: ${params.from_email}`);
  if (params.subject) parts.push(`Subject: ${params.subject}`);
  if (params.sent_at) parts.push(`Date: ${params.sent_at}`);
  return parts.join('\n');
}
