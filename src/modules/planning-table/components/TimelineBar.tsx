'use client';

type TimelineBarProps = {
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly color: string | null;
  readonly timelineStart: string;
  readonly timelineEnd: string;
};

export function TimelineBar({ startDate, endDate, color, timelineStart, timelineEnd }: TimelineBarProps) {
  if (!startDate || !endDate) return null;

  const rangeStart = new Date(timelineStart).getTime();
  const rangeEnd = new Date(timelineEnd).getTime();
  const totalRange = rangeEnd - rangeStart;

  if (totalRange <= 0) return null;

  const barStart = new Date(startDate).getTime();
  const barEnd = new Date(endDate).getTime();

  const leftPercent = Math.max(0, ((barStart - rangeStart) / totalRange) * 100);
  const widthPercent = Math.max(2, Math.min(100 - leftPercent, ((barEnd - barStart) / totalRange) * 100));

  return (
    <div className="relative h-4 w-full rounded-lg bg-slate-100">
      <div
        className="absolute top-0.5 h-3 rounded-lg"
        style={{
          left: `${leftPercent}%`,
          width: `${widthPercent}%`,
          backgroundColor: color ?? '#6366F1',
          opacity: 0.7,
        }}
      />
    </div>
  );
}

/**
 * Calculate the overall timeline range from a set of rows.
 */
export function getTimelineRange(
  rows: readonly { start_date: string | null; end_date: string | null }[]
): { start: string; end: string } | null {
  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (const row of rows) {
    if (row.start_date) {
      if (!minDate || row.start_date < minDate) minDate = row.start_date;
    }
    if (row.end_date) {
      if (!maxDate || row.end_date > maxDate) maxDate = row.end_date;
    }
  }

  if (!minDate || !maxDate) return null;
  return { start: minDate, end: maxDate };
}
