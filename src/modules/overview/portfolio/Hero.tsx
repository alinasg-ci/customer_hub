'use client';

import { useEffect, useState } from 'react';
import s from './portfolio.module.css';

function Clock() {
  const [time, setTime] = useState<string>('— : —');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm} · TLV`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  return <div className={s.heroDate}>{time}</div>;
}

export function TopBar() {
  return (
    <div className={s.top}>
      <div className={s.crumb}>
        Workspace / <b>Overview</b>
      </div>
      <div className={s.spacer} />
      <div className={s.ticker}>
        <span className={s.livePill}>LIVE</span>
        <span>
          Tracking · Autumn Campaign ·{' '}
          <span style={{ fontFamily: 'var(--font-mono)' }}>00:42:18</span>
        </span>
        <button type="button" className={s.tickerStop}>Stop</button>
      </div>
      <button type="button" className={`${s.btn} ${s.btnSecondary}`}>Export</button>
      <button type="button" className={`${s.btn} ${s.btnSwatch}`}>+ New client</button>
    </div>
  );
}

export function HeroGreeting({
  name = 'Adi',
  clientCount = 12,
  dateLabel = 'Monday · October 28 · Q4 2025',
  subtitle = 'Four clients on track, three need a glance, one bakery invoice is ready to send. Here is the whole portfolio at once.',
}: {
  readonly name?: string;
  readonly clientCount?: number;
  readonly dateLabel?: string;
  readonly subtitle?: string;
}) {
  return (
    <section className={s.heroRow}>
      <div>
        <div className="clay-label">{dateLabel}</div>
        <h1 className={s.heroDisplay}>
          Good morning, <em>{name}</em>.
        </h1>
        <div className={s.heroSub}>{subtitle}</div>
      </div>
      <Clock />
      <div className={s.heroSticker}>★ {clientCount} active clients</div>
    </section>
  );
}
