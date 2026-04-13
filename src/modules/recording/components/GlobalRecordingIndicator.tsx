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
    <div className="clay-card fixed bottom-6 right-6 z-40 flex items-center gap-3 border-pomegranate-300 px-4 py-3">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pomegranate-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pomegranate-400" />
      </span>

      <div className="text-sm">
        <button
          onClick={handleNavigate}
          className="font-medium text-matcha-600 hover:text-matcha-800 hover:underline"
        >
          {recording.projectName}
        </button>
        <span className="ml-2 font-mono font-semibold text-black">
          {formatElapsedTime(elapsedSeconds)}
        </span>
      </div>

      <button
        onClick={async () => {
          try {
            await stopRecording();
          } catch {
            // Recording state already cleared; user can see the entry wasn't saved
          }
        }}
        className="clay-btn clay-btn-danger px-2.5 py-1 text-xs"
      >
        Stop
      </button>
    </div>
  );
}
