'use client';

import type { CalendarEntry } from '../types';

type CalendarBlockProps = {
  readonly entry: CalendarEntry;
  readonly color: string;
  readonly hourHeight: number;
  readonly startHour: number;
};

export function CalendarBlock({ entry, color, hourHeight, startHour }: CalendarBlockProps) {
  const top = startHour * hourHeight;
  const height = Math.max(hourHeight * 0.25, entry.durationHours * hourHeight);
  const isBillable = entry.billable;

  return (
    <div
      className="absolute left-1 right-1 rounded-md px-2 py-1 text-[11px] leading-tight overflow-hidden cursor-default transition-shadow hover:shadow-md"
      style={{
        top,
        height,
        backgroundColor: isBillable ? color : undefined,
        backgroundImage: !isBillable
          ? `repeating-linear-gradient(135deg, ${color}40, ${color}40 3px, ${color}20 3px, ${color}20 6px)`
          : undefined,
        color: isBillable ? '#fff' : color,
        border: !isBillable ? `1px solid ${color}60` : 'none',
      }}
      title={`${entry.clientName} > ${entry.projectName}${entry.phaseName ? ` > ${entry.phaseName}` : ''}${entry.taskName ? ` > ${entry.taskName}` : ''}\n${entry.durationHours.toFixed(2)}h${!isBillable ? ' (non-billable)' : ''}`}
    >
      <div className="font-medium truncate">{entry.clientName}</div>
      {height > hourHeight * 0.4 && (
        <div className="truncate opacity-80">{entry.projectName}</div>
      )}
      {height > hourHeight * 0.6 && entry.phaseName && (
        <div className="truncate opacity-70">{entry.phaseName}</div>
      )}
      {height > hourHeight * 0.8 && entry.taskName && (
        <div className="truncate opacity-60">{entry.taskName}</div>
      )}
    </div>
  );
}
