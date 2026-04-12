'use client';

import { useMemo } from 'react';
import { getMonthDates, toDateString, isSameDay, getEntriesForDate, getDayTotal, formatMonthHeader, getClientColor } from '../utils/calendarHelpers';
import { formatHours } from '@/shared/utils/formatHours';
import { cn } from '@/shared/utils/cn';
import type { CalendarEntry } from '../types';

type MonthViewProps = {
  readonly entries: readonly CalendarEntry[];
  readonly currentDate: Date;
  readonly clientIds: readonly string[];
  readonly onDayClick: (date: Date) => void;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MonthView({ entries, currentDate, clientIds, onDayClick }: MonthViewProps) {
  const monthDates = useMemo(() => getMonthDates(currentDate), [currentDate]);
  const today = new Date();
  const currentMonth = currentDate.getMonth();

  // Monthly total — only count days in the current month
  const monthTotal = useMemo(() => {
    const monthDateStrs = new Set(
      monthDates.filter((d) => d.getMonth() === currentMonth).map(toDateString)
    );
    return entries.filter((e) => monthDateStrs.has(e.date)).reduce((s, e) => s + e.durationHours, 0);
  }, [entries, monthDates, currentMonth]);

  return (
    <div>
      {/* Month total */}
      <div className="mb-2 text-right text-xs text-slate-500">
        Month total: <span className="font-semibold text-slate-700">{formatHours(monthTotal)}</span>
      </div>

    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {monthDates.map((date) => {
          const dateStr = toDateString(date);
          const dayEntries = getEntriesForDate(entries, dateStr);
          const dayTotal = getDayTotal(dayEntries);
          const isToday = isSameDay(date, today);
          const isCurrentMonth = date.getMonth() === currentMonth;

          // Group entries by client for colored dots
          const clientGroups = new Map<string, number>();
          for (const e of dayEntries) {
            const cid = e.clientId ?? 'unknown';
            clientGroups.set(cid, (clientGroups.get(cid) ?? 0) + e.durationHours);
          }

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(date)}
              className={cn(
                'min-h-[80px] border-b border-r border-slate-100 p-1.5 text-left transition-colors hover:bg-slate-50',
                !isCurrentMonth && 'opacity-40'
              )}
            >
              <div className={cn(
                'text-[11px] font-medium mb-1',
                isToday ? 'flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white' : 'text-slate-600'
              )}>
                {date.getDate()}
              </div>

              {/* Client color bars */}
              {dayEntries.length > 0 && (
                <div className="space-y-0.5">
                  {Array.from(clientGroups.entries()).slice(0, 3).map(([cid, hours]) => (
                    <div
                      key={cid}
                      className="h-1.5 rounded-full"
                      style={{
                        backgroundColor: getClientColor(cid, clientIds),
                        width: `${Math.min(100, (hours / 8) * 100)}%`,
                      }}
                    />
                  ))}
                </div>
              )}

              {dayTotal > 0 && (
                <div className="mt-1 text-[10px] font-medium text-slate-500">
                  {formatHours(dayTotal)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
    </div>
  );
}
