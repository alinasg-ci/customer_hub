'use client';

type TimeAxisProps = {
  readonly hourHeight: number;
  readonly hours?: number;
};

export function TimeAxis({ hourHeight, hours = 24 }: TimeAxisProps) {
  return (
    <div className="relative w-14 shrink-0 text-right pr-2 text-[11px] text-slate-400 select-none">
      {Array.from({ length: hours }, (_, i) => (
        <div
          key={i}
          className="absolute right-2"
          style={{ top: i * hourHeight - 6, height: hourHeight }}
        >
          {String(i).padStart(2, '0')}:00
        </div>
      ))}
    </div>
  );
}
