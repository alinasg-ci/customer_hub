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
      <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
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
          <div key={date} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {/* Day header */}
            <div className={cn(
              'flex items-center justify-between px-4 py-2.5 border-b border-slate-100',
              isToday ? 'bg-indigo-50' : 'bg-slate-50/80'
            )}>
              <span className={cn('text-sm font-medium', isToday ? 'text-indigo-700' : 'text-slate-700')}>
                {dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="text-xs font-semibold text-slate-600">{formatHours(dayTotal)}</span>
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
                    <tr key={entry.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50">
                      <td className="py-2 pl-4 pr-2 w-4">
                        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                      </td>
                      <td className="py-2 px-2 text-slate-500 text-xs w-28">{timeStr}</td>
                      <td className="py-2 px-2 text-slate-800">
                        <span className="font-medium">{entry.clientName}</span>
                        <span className="text-slate-400"> &gt; </span>
                        {entry.projectName}
                        {entry.phaseName && <span className="text-slate-400"> &gt; {entry.phaseName}</span>}
                        {entry.taskName && <span className="text-slate-400"> &gt; {entry.taskName}</span>}
                      </td>
                      <td className="py-2 px-2 text-right font-medium text-slate-700 w-20">
                        {formatHours(entry.durationHours)}
                      </td>
                      <td className="py-2 pr-4 w-20 text-center">
                        <span className={cn(
                          'inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                          entry.billable
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
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
