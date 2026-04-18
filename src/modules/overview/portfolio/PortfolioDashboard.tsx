'use client';

import { useState } from 'react';
import {
  FEED_ITEMS,
  KPI_TILES,
  PORTFOLIO_CLIENTS,
  PORTFOLIO_STATS,
  STICKY_NOTE,
  TODAY_ITEMS,
} from './data';
import { HeroGreeting, TopBar } from './Hero';
import { KpiStrip } from './KpiTile';
import { ClientGrid } from './PortfolioClientCard';
import {
  AlertRow,
  Donut,
  FeedRow,
  Panel,
  PortfolioFooter,
  StickyNote,
  TodayRow,
} from './Rail';
import s from './portfolio.module.css';

const FILTERS = ['All · 12', 'Retainer · 5', 'Project · 4', 'Attention · 3'] as const;

function FilterSeg() {
  const [on, setOn] = useState<(typeof FILTERS)[number]>(FILTERS[0]);
  return (
    <div className={s.seg} role="tablist">
      {FILTERS.map((label) => (
        <button
          key={label}
          type="button"
          role="tab"
          aria-selected={label === on}
          className={`${s.segBtn} ${label === on ? s.segBtnOn : ''}`}
          onClick={() => setOn(label)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SectionHead({
  title,
  meta,
  children,
}: {
  readonly title: string;
  readonly meta?: string;
  readonly children?: React.ReactNode;
}) {
  return (
    <div className={s.sectionHead}>
      <div>
        <h2 className={s.sectionTitle}>{title}</h2>
        {meta && <div className={s.sectionMeta}>{meta}</div>}
      </div>
      {children && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{children}</div>}
    </div>
  );
}

export function PortfolioDashboard() {
  const sortedClients = [...PORTFOLIO_CLIENTS].sort((a, b) => b.mtdIls - a.mtdIls);
  const stats = PORTFOLIO_STATS;
  const alerts = PORTFOLIO_CLIENTS.filter((c) => c.alert);

  return (
    <div className={s.canvas}>
      <TopBar />
      <HeroGreeting name="Adi" clientCount={stats.activeCount + 1} />
      <KpiStrip tiles={KPI_TILES} />

      <SectionHead title="Clients" meta="12 total · sorted by MTD revenue">
        <FilterSeg />
      </SectionHead>

      <div className={s.bodyGrid}>
        <ClientGrid clients={sortedClients} />

        <aside className={s.rail}>
          <Panel title="Retainer capacity">
            <Donut
              pct={stats.retainerPct}
              used={stats.retainerHoursUsed.toFixed(0)}
              remaining={(stats.retainerHoursCap - stats.retainerHoursUsed).toFixed(0)}
              subtitle="Across 5 retainer clients"
            />
          </Panel>

          <Panel title={`Needs attention · ${alerts.length}`}>
            {alerts.map((c) => (
              <AlertRow key={c.id} client={c} />
            ))}
          </Panel>

          <Panel title="Today">
            <div>
              {TODAY_ITEMS.map((t) => (
                <TodayRow key={t.time} item={t} />
              ))}
            </div>
          </Panel>

          <Panel title="Activity">
            <div className={s.activity}>
              {FEED_ITEMS.map((f, i) => (
                <FeedRow key={`${f.when}-${f.what}`} item={f} first={i === 0} />
              ))}
            </div>
          </Panel>

          <StickyNote body={STICKY_NOTE.body} sig={STICKY_NOTE.sig} />
        </aside>
      </div>

      <PortfolioFooter />
    </div>
  );
}
