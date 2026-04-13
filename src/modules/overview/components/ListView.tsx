'use client';

import { useMemo } from 'react';
import { getClientColor, toDateString, getDayTotal } from '../utils/calendarHelpers';
import { formatHours } from '@/shared/utils/formatHours';
import { cn } from '@/shared/utils/cn';
import type { CalendarEntry } from '../types';

type ListViewProps = {
  readonly entries: readonly CalendarEntry[];
  readonly clientIds: readonly string[];
};

export function ListView({ entries, clientIds }: ListViewProps) {
  // Group entries by date
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const e of entries) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30); // last 30 days max
  }, [entries]);

  if (grouped.length === 0) {
    return (
      <div className="rounded-[12px] border-2 border-dashed border-oat-300 py-12 text-center text-sm text-charcoal-500">
        No time entries yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(([date, dayEntries]) => {
        const dayTotal = getDayTotal(dayEntries);
        const dateObj = new Date(date + 'T00:00:00');
        const isToday = toDateString(new Date()) === date;

        return (
          <div key={date} className="rounded-[12px] border border-oat-300 bg-white overflow-hidden">
            {/* Day header */}
            <div className={cn(
              'flex items-center justify-between px-4 py-2.5 border-b border-oat-200',
              isToday ? 'bg-matcha-50' : 'bg-cream-dark'
            )}>
              <span className={cn('text-sm font-medium', isToday ? 'text-matcha-700' : 'text-charcoal-700')}>
                {dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="text-xs font-semibold text-charcoal-500">{formatHours(dayTotal)}</span>
            </div>

            {/* Entries */}
            <table className="w-full text-sm">
              <tbody>
                {dayEntries.map((entry) => {
                  const color = getClientColor(entry.clientId, clientIds);
                  const timeStr = entry.startTime && entry.endTime
                    ? `${new Date(entry.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${new Date(entry.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                    : '—';

                  return (
                    <tr key={entry.id} className="border-b border-oat-100 last:border-b-0 hover:bg-oat-100">
                      <td className="py-2 pl-4 pr-2 w-4">
                        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                      </td>
                      <td className="py-2 px-2 text-charcoal-500 text-xs w-28">{timeStr}</td>
                      <td className="py-2 px-2 text-charcoal-700">
                        <span className="font-medium">{entry.clientName}</span>
                        <span className="text-oat-500"> &gt; </span>
                        {entry.projectName}
                        {entry.phaseName && <span className="text-oat-500"> &gt; {entry.phaseName}</span>}
                        {entry.taskName && <span className="text-oat-500"> &gt; {entry.taskName}</span>}
                      </td>
                      <td className="py-2 px-2 text-right font-medium text-charcoal-700 w-20">
                        {formatHours(entry.durationHours)}
                      </td>
                      <td className="py-2 pr-4 w-20 text-center">
                        <span className={cn(
                          'inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                          entry.billable
                            ? 'bg-matcha-50 text-matcha-700 border-matcha-200'
                            : 'bg-oat-100 text-charcoal-500 border-oat-300'
                        )}>
                          {entry.billable ? 'Billable' : 'Non-bill'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
