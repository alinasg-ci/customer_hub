'use client';

import { cn } from '@/shared/utils/cn';
import type { EmailRow } from '../types';

const SOURCE_LABEL: Record<string, { label: string; tint: string }> = {
  domain:        { label: 'domain',        tint: 'bg-matcha-300/30 text-matcha-800 border-matcha-500' },
  contact:       { label: 'contact',       tint: 'bg-matcha-300/30 text-matcha-800 border-matcha-500' },
  learned_rule:  { label: 'learned',       tint: 'bg-slushie-300/40 text-slushie-800 border-slushie-500' },
  client_name:   { label: 'name match',    tint: 'bg-lemon-400/30 text-lemon-800 border-lemon-700' },
  llm:           { label: 'AI',            tint: 'bg-ube-300/40 text-ube-900 border-ube-500' },
  manual:        { label: 'manual',        tint: 'bg-oat-200 text-charcoal-700 border-oat-300' },
  unrouted:      { label: 'unrouted',      tint: 'bg-pomegranate-300/30 text-pomegranate-700 border-pomegranate-400' },
};

export function EmailCard({ email }: { readonly email: EmailRow }) {
  const source = SOURCE_LABEL[email.routing_source] ?? SOURCE_LABEL.manual;
  const date = email.sent_at ? new Date(email.sent_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: '2-digit'
  }) : '—';

  return (
    <article className="clay-card-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px]">
              <span className={cn('rounded-md border px-1.5 py-0.5 font-medium', source.tint)}>
                {source.label}
              </span>
              {email.mentions_hours && (
                <span className="rounded-md border border-lemon-700 bg-lemon-400/30 px-1.5 py-0.5 font-medium text-lemon-800">
                  ~{email.hours_suggestion_amount?.toFixed(1) ?? '?'}h
                </span>
              )}
              {email.is_manual && (
                <span className="clay-label">MANUAL</span>
              )}
            </div>
            <h3 className="mt-1.5 truncate text-[15px] font-semibold text-black">
              {email.subject || <span className="text-charcoal-300 italic">(no subject)</span>}
            </h3>
            <p className="clay-mono mt-0.5 truncate text-[11px] text-charcoal-500">
              {email.from_name ? `${email.from_name} ` : ''}&lt;{email.from_email}&gt;
            </p>
          </div>
          <span className="clay-mono flex-shrink-0 text-[11px] text-oat-500">{date}</span>
        </div>
        {email.snippet && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-charcoal-500">
            {email.snippet}
          </p>
        )}
      </div>
    </article>
  );
}
