'use client';

import { useMemo } from 'react';
import { CalendarBlock } from './CalendarBlock';
import { TimeAxis } from './TimeAxis';
import { toDateString, isSameDay, getEntriesForDate, getDayTotal, getStartHour, getClientColor } from '../utils/calendarHelpers';
import { formatHours } from '@/shared/utils/formatHours';
import { cn } from '@/shared/utils/cn';
import type { CalendarEntry } from '../types';

type DayViewProps = {
  readonly entries: readonly CalendarEntry[];
  readonly currentDate: Date;
  readonly clientIds: readonly string[];
  readonly hourHeight: number;
};

const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function DayView({ entries, currentDate, clientIds, hourHeight }: DayViewProps) {
  const dateStr = toDateString(currentDate);
  const dayEntries = useMemo(() => getEntriesForDate(entries, dateStr), [entries, dateStr]);
  const dayTotal = getDayTotal(dayEntries);
  const isToday = isSameDay(currentDate, new Date());
  const totalHeight = 24 * hourHeight;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col" style={{ maxHeight: '75vh' }}>
      {/* Fixed header */}
      <div className={cn(
        'flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0',
        isToday ? 'bg-indigo-50' : 'bg-slate-50'
      )}>
        <div className="flex items-center gap-3">
          <span className={cn(
            'text-xl font-semibold leading-none',
            isToday ? 'flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white text-base' : 'text-slate-800'
          )}>
            {currentDate.getDate()}
          </span>
          <div>
            <div className={cn('text-sm font-semibold', isToday ? 'text-indigo-600' : 'text-slate-700')}>
              {WEEKDAY_FULL[currentDate.getDay()]}
            </div>
            <div className="text-xs text-slate-400">
              {currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Total</span>
          <p className="text-lg font-semibold text-slate-800">{formatHours(dayTotal)}</p>
        </div>
      </div>

      {/* Scrollable time grid */}
      <div className="flex overflow-y-auto flex-1">
        <div className="relative shrink-0 w-14 border-r border-slate-100" style={{ height: totalHeight }}>
          <TimeAxis hourHeight={hourHeight} />
        </div>
        <div className={cn('relative flex-1', isToday && 'bg-indigo-50/20')} style={{ height: totalHeight }}>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-slate-50" style={{ top: i * hourHeight }} />
          ))}
          {dayEntries.map((entry) => (
            <CalendarBlock
              key={entry.id}
              entry={entry}
              color={getClientColor(entry.clientId, clientIds)}
              hourHeight={hourHeight}
              startHour={getStartHour(entry)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
