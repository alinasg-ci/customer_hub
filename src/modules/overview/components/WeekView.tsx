'use client';

import { useMemo } from 'react';
import { CalendarBlock } from './CalendarBlock';
import { TimeAxis } from './TimeAxis';
import { getWeekDates, toDateString, isSameDay, getEntriesForDate, getDayTotal, getStartHour, getClientColor } from '../utils/calendarHelpers';
import { formatHours } from '@/shared/utils/formatHours';
import { cn } from '@/shared/utils/cn';
import type { CalendarEntry } from '../types';

type WeekViewProps = {
  readonly entries: readonly CalendarEntry[];
  readonly currentDate: Date;
  readonly clientIds: readonly string[];
  readonly hourHeight: number;
};

const WEEKDAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function WeekView({ entries, currentDate, clientIds, hourHeight }: WeekViewProps) {
  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const today = new Date();
  const totalHeight = 24 * hourHeight;

  const weekTotal = useMemo(() => {
    const weekDateStrs = new Set(weekDates.map(toDateString));
    return entries.filter((e) => weekDateStrs.has(e.date)).reduce((s, e) => s + e.durationHours, 0);
  }, [entries, weekDates]);

  return (
    <div className="rounded-[12px] border border-oat-300 bg-white overflow-hidden flex flex-col" style={{ maxHeight: '75vh' }}>
      {/* Fixed header — always visible */}
      <div className="flex border-b border-oat-300 bg-cream shrink-0">
        {/* Week total in time-axis corner */}
        <div className="shrink-0 w-14 border-r border-oat-300 flex flex-col items-center justify-center py-2">
          <span className="text-[10px] font-medium text-oat-500">Week</span>
          <span className="text-xs font-semibold text-charcoal-700">{formatHours(weekTotal)}</span>
        </div>

        {/* Day headers */}
        {weekDates.map((date, i) => {
          const dateStr = toDateString(date);
          const dayEntries = getEntriesForDate(entries, dateStr);
          const isToday = isSameDay(date, today);
          const dayTotal = getDayTotal(dayEntries);

          return (
            <div
              key={dateStr}
              className={cn(
                'flex-1 min-w-0 border-r border-oat-300 last:border-r-0 px-2 py-2 flex items-center gap-2',
                isToday && 'bg-matcha-50'
              )}
            >
              <span className={cn(
                'text-xl font-semibold leading-none',
                isToday ? 'flex h-8 w-8 items-center justify-center rounded-full bg-matcha-600 text-white text-sm' : 'text-charcoal-700'
              )}>
                {date.getDate()}
              </span>
              <div className="min-w-0">
                <div className={cn(
                  'text-[11px] font-semibold tracking-wide',
                  isToday ? 'text-matcha-600' : 'text-oat-500'
                )}>
                  {WEEKDAY_SHORT[i]}
                </div>
                <div className={cn('text-[11px]', dayTotal > 0 ? 'text-charcoal-500 font-medium' : 'text-oat-500')}>
                  {formatHours(dayTotal)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div className="flex overflow-y-auto flex-1">
        {/* Time axis */}
        <div className="relative shrink-0 w-14 border-r border-oat-200" style={{ height: totalHeight }}>
          <TimeAxis hourHeight={hourHeight} />
        </div>

        {/* Day columns */}
        {weekDates.map((date) => {
          const dateStr = toDateString(date);
          const dayEntries = getEntriesForDate(entries, dateStr);
          const isToday = isSameDay(date, today);

          return (
            <div
              key={dateStr}
              className={cn(
                'relative flex-1 min-w-0 border-r border-oat-200 last:border-r-0',
                isToday && 'bg-matcha-50/30'
              )}
              style={{ height: totalHeight }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-oat-100"
                  style={{ top: i * hourHeight }}
                />
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
          );
        })}
      </div>
    </div>
  );
}
