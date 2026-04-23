'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRecording } from '../context/RecordingContext';
import { formatElapsedTime } from '../calculations';

export function GlobalRecordingIndicator() {
  const { recording, isRecording, elapsedSeconds, stopRecording } = useRecording();
  const pathname = usePathname();
  const router = useRouter();

  if (!isRecording || !recording) return null;

  const projectPath = `/client/${recording.clientId}/project/${recording.projectId}`;
  const onProjectPage = pathname === projectPath;

  const handleNavigate = () => {
    if (!onProjectPage) router.push(projectPath);
  };

  const handleStop = async () => {
    try {
      await stopRecording();
    } catch {
      // Recording state already cleared; user can see the entry wasn't saved
    }
  };

  return (
    <div
      className="fixed top-4 left-1/2 z-40 -translate-x-1/2 inline-flex items-center gap-[10px] rounded-full bg-black pl-1 pr-1 py-[6px] text-[13px] text-white shadow-[var(--shadow-clay-lg)]"
    >
      {/* LIVE chip */}
      <span className="rounded-full bg-lemon-500 px-2 py-[2px] text-[11px] font-semibold uppercase tracking-wider text-black">
        LIVE
      </span>

      {/* Label + mono timer */}
      <button
        type="button"
        onClick={handleNavigate}
        disabled={onProjectPage}
        className="flex items-center gap-2 pl-1 text-left hover:text-lemon-500 disabled:cursor-default disabled:hover:text-white"
        title={onProjectPage ? undefined : `Open ${recording.projectName}`}
      >
        <span>Tracking · {recording.projectName}</span>
        <span className="clay-mono font-semibold tabular-nums">
          {formatElapsedTime(elapsedSeconds)}
        </span>
      </button>

      {/* Stop button */}
      <button
        type="button"
        onClick={handleStop}
        className="ml-1 rounded-full bg-white px-3 py-[6px] text-[12px] font-medium text-black transition-colors hover:bg-lemon-500"
      >
        Stop
      </button>
    </div>
  );
}
