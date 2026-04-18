'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { PortfolioClient, TintColor } from './data';
import s from './portfolio.module.css';

const TINT: Record<TintColor, string> = {
  matcha: 'var(--color-matcha-500)',
  slushie: 'var(--color-slushie-500)',
  lemon: 'var(--color-lemon-500)',
  ube: 'var(--color-ube-500)',
  pomegranate: 'var(--color-pomegranate-400)',
};

const TINT_DARK: Record<TintColor, string> = {
  matcha: 'var(--color-matcha-800)',
  slushie: 'var(--color-slushie-800)',
  lemon: 'var(--color-lemon-800)',
  ube: 'var(--color-ube-800)',
  pomegranate: 'var(--color-pomegranate-600)',
};

const TINT_FG: Record<TintColor, string> = {
  matcha: '#fff',
  slushie: '#fff',
  lemon: '#000',
  ube: '#fff',
  pomegranate: '#fff',
};

function marginClass(m: number | null): string {
  if (m == null) return '';
  if (m >= 40) return s.statValueGood;
  if (m >= 30) return s.statValueMid;
  return s.statValueBad;
}

function capClass(pct: number | null): string {
  if (pct == null) return '';
  if (pct >= 95) return s.barFillBad;
  if (pct >= 80) return s.barFillWarn;
  return '';
}

export function PortfolioClientCard({ client }: { readonly client: PortfolioClient }) {
  const pct = client.retainerCap && client.retainerUsed != null
    ? Math.round((client.retainerUsed / client.retainerCap) * 100)
    : null;
  const scoreColor = client.score.startsWith('A') ? '#fff' : '#000';
  const style = {
    '--tint': TINT[client.color],
    '--tint-fg': TINT_FG[client.color],
    '--tint-dark': TINT_DARK[client.color],
  } as CSSProperties;

  return (
    <Link href={`/client/${client.id}`} className={s.ccard} style={style}>
      <div className={s.ccardHeader}>
        <div className={s.ccardHeaderHatch} />
        <div className={s.ccardTagRow}>
          <span className={s.ccardBadge}>{client.tag.toUpperCase()}</span>
          <span className={s.ccardStatus}>
            <span className={s.ccardStatusDot} /> ACTIVE
          </span>
        </div>
        <div className={s.ccardNameRow}>
          <div>
            <div className={s.ccardName}>{client.name}</div>
            <div className={s.ccardHandle}>
              @{client.handle} · {client.region}
            </div>
          </div>
          <div className={s.ccardScore} style={{ color: scoreColor }}>
            {client.score}
          </div>
        </div>
      </div>

      <div className={s.ccardBody}>
        <div className={s.ccardStats}>
          <div>
            <div className={s.statLabel}>MTD income</div>
            <div className={s.statValue}>
              <span className={s.statCurrency}>₪</span>
              {client.mtdIls.toLocaleString()}
            </div>
          </div>
          <div>
            <div className={s.statLabel}>Profit margin</div>
            <div className={`${s.statValue} ${marginClass(client.margin)}`}>
              {client.margin ? `${client.margin.toFixed(1)}%` : '—'}
            </div>
          </div>
        </div>

        {pct === null ? (
          <div className={s.noRetainer}>{'// project-billed — no retainer'}</div>
        ) : (
          <div>
            <div className={s.bar}>
              <div
                className={`${s.barFill} ${capClass(pct)}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className={s.bmeta}>
              <span>
                {client.retainerUsed}/{client.retainerCap}h retainer
              </span>
              <span>{pct}% consumed</span>
            </div>
          </div>
        )}

        {client.alert && <div className={s.alertChip}>{client.alert}</div>}

        <div className={s.footerRow}>
          <span className={s.tagChip}>
            {client.activeProjects} project{client.activeProjects !== 1 ? 's' : ''} active
          </span>
          <span className={s.arrow} aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}

export function AddCard() {
  return (
    <button type="button" className={s.addCard}>
      <div className={s.addCardPlus}>+</div>
      <div>Add a new client</div>
      <div className={s.addCardMeta}>retainer · project · hour bank</div>
    </button>
  );
}

export function ClientGrid({ clients }: { readonly clients: readonly PortfolioClient[] }) {
  return (
    <section className={s.cgrid}>
      {clients.map((c) => (
        <PortfolioClientCard key={c.id} client={c} />
      ))}
      <AddCard />
    </section>
  );
}
