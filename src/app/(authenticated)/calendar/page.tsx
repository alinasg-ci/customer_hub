'use client';

import { OverviewCalendar } from '@/modules/overview';

export default function CalendarPage() {
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div>
      {/* Hero */}
      <section className="relative mb-8">
        <div className="clay-label">{dateLabel.toUpperCase()}</div>
        <h1
          className="my-2 font-semibold text-black"
          style={{
            fontSize: 'clamp(44px, 6vw, 72px)',
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            fontFeatureSettings: '"ss01","ss03"',
          }}
        >
          Your <em className="not-italic text-slushie-500">calendar</em>.
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-charcoal-500">
          Every hour across every project — scroll, zoom, and drag to reassign.
        </p>
        <div className="clay-sticker absolute right-2 top-2 hidden sm:inline-flex" style={{ transform: 'rotate(-6deg)' }}>
          ★ this week
        </div>
      </section>
      <OverviewCalendar />
    </div>
  );
}
