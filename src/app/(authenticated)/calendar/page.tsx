'use client';

import { OverviewCalendar } from '@/modules/overview';

export default function CalendarPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-black">Calendar</h1>
        <p className="mt-1 text-sm text-charcoal-500">Your time across all projects</p>
      </div>
      <OverviewCalendar />
    </div>
  );
}
