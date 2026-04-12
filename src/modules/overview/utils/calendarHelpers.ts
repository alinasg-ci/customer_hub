import type { CalendarEntry } from '../types';

const CLIENT_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#3B82F6', '#06B6D4',
] as const;

export function getClientColor(clientId: string | null, allClientIds: readonly string[]): string {
  if (!clientId) return '#94A3B8';
  const index = allClientIds.indexOf(clientId);
  return CLIENT_COLORS[index >= 0 ? index % CLIENT_COLORS.length : 0];
}

export function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function getMonthDates(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = (first.getDay() + 6) % 7;

  const dates: Date[] = [];
  for (let i = -startDay; i <= last.getDate() + (6 - ((last.getDay() + 6) % 7)) - 1; i++) {
    dates.push(new Date(year, month, i + 1));
  }
  return dates;
}

export function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateString(a) === toDateString(b);
}

export function getEntriesForDate(entries: readonly CalendarEntry[], date: string): CalendarEntry[] {
  return entries.filter((e) => e.date === date);
}

export function getDayTotal(entries: readonly CalendarEntry[]): number {
  return entries.reduce((s, e) => s + e.durationHours, 0);
}

export function getStartHour(entry: CalendarEntry): number {
  if (!entry.startTime) return 8; // default to 8am for entries without time
  return new Date(entry.startTime).getHours() + new Date(entry.startTime).getMinutes() / 60;
}

export function formatDayHeader(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatMonthHeader(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
