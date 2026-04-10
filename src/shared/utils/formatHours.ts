/**
 * Format decimal hours as HH:MM string.
 * Examples: 0.5 → "00:30", 1.75 → "01:45", 0.08 → "00:05", 12.5 → "12:30"
 */
export function formatHours(hours: number): string {
  const totalMinutes = Math.round(Math.abs(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const sign = hours < 0 ? '-' : '';
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
