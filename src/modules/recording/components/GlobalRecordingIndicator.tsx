'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRecording } from '../context/RecordingContext';
import { formatElapsedTime } from '../calculations';

export function GlobalRecordingIndicator() {
  const { recording, isRecording, elapsedSeconds, stopRecording } = useRecording();
  const pathname = usePathname();
  const router = useRouter();

  if (!isRecording || !recording) return null;

  // Hide if we're already on the recording's project page
  const projectPath = `/client/${recording.clientId}/project/${recording.projectId}`;
  if (pathname === projectPath) return null;

  const handleNavigate = () => {
    router.push(projectPath);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-2xl border border-red-200 bg-white px-4 py-3 shadow-lg">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>

      <div className="text-sm">
        <button
          onClick={handleNavigate}
          className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          {recording.projectName}
        </button>
        <span className="ml-2 font-mono font-semibold text-slate-900">
          {formatElapsedTime(elapsedSeconds)}
        </span>
      </div>

      <button
        onClick={stopRecording}
        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
      >
        Stop
      </button>
    </div>
  );
}
