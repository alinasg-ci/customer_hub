import type { CSSProperties, ReactNode } from 'react';
import type { FeedItem, PortfolioClient, TintColor, TodayItem } from './data';
import s from './portfolio.module.css';

const TINT: Record<TintColor, string> = {
  matcha: 'var(--color-matcha-500)',
  slushie: 'var(--color-slushie-500)',
  lemon: 'var(--color-lemon-500)',
  ube: 'var(--color-ube-500)',
  pomegranate: 'var(--color-pomegranate-400)',
};

export function Panel({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <div className={s.panel}>
      <h3 className={s.panelTitle}>{title}</h3>
      {children}
    </div>
  );
}

export function Donut({
  pct,
  used,
  remaining,
  subtitle,
}: {
  readonly pct: number;
  readonly used: string;
  readonly remaining: string;
  readonly subtitle: string;
}) {
  const style = { '--p': `${pct}%` } as CSSProperties;
  return (
    <div className={s.donutWrap}>
      <div className={s.donut} style={style}>
        <div className={s.donutInner}>
          {pct}
          <span>%</span>
        </div>
      </div>
      <div className={s.legend}>
        <div className={s.legendRow}>
          <i className={s.legendSwatch} style={{ background: 'var(--color-matcha-500)' }} />
          Used · {used}h
        </div>
        <div className={s.legendRow}>
          <i className={s.legendSwatch} style={{ background: 'var(--color-oat-200)' }} />
          Free · {remaining}h
        </div>
        <div className={s.legendSubtitle}>{subtitle}</div>
      </div>
    </div>
  );
}

export function AlertRow({ client }: { readonly client: PortfolioClient }) {
  return (
    <div className={s.alertRow}>
      <div className={s.alertRowSwatch} style={{ background: TINT[client.color] }} />
      <div>
        <strong className={s.alertRowName}>{client.name}</strong>
        <div className={s.alertRowMsg}>{client.alert}</div>
      </div>
    </div>
  );
}

export function TodayRow({ item }: { readonly item: TodayItem }) {
  return (
    <div className={s.todayRow}>
      <div className={s.todayTime}>{item.time}</div>
      <div className={s.todaySwatch} style={{ background: TINT[item.color] }} />
      <div className={item.done ? s.todayDoneLabel : ''}>{item.label}</div>
      <div className={s.todayStatus}>{item.done ? 'DONE' : '•'}</div>
    </div>
  );
}

export function FeedRow({ item, first }: { readonly item: FeedItem; readonly first: boolean }) {
  return (
    <div className={`${s.activityRow} ${first ? s.activityRowFirst : ''}`}>
      <div>{item.what}</div>
      <div className={s.activityRowMeta}>
        {item.when} · <span className={s.activityWho}>{item.who}</span>{' '}
        <span className={s.activityTag}>{item.tag}</span>
      </div>
    </div>
  );
}

export function StickyNote({
  title = 'Sticky note',
  body,
  sig,
}: {
  readonly title?: string;
  readonly body: string;
  readonly sig?: string;
}) {
  return (
    <div className={s.stickyNote}>
      <h3 className={s.stickyNoteTitle}>{title}</h3>
      <div className={s.stickyNoteBody}>{body}</div>
      {sig && <div className={s.stickyNoteSig}>— {sig}</div>}
    </div>
  );
}

export function PortfolioFooter() {
  return (
    <footer className={s.foot}>
      <div className={s.footMono}>portfolio_id · pf_8f3a · synced 12 sec ago</div>
      <div className={s.footActions}>
        <button type="button" className={s.btnGhost}>
          Export portfolio report
        </button>
        <button type="button" className={s.btnGhost}>
          Adjust workspace
        </button>
      </div>
    </footer>
  );
}
