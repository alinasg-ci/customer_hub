'use client';

import { useRecording } from '../context/RecordingContext';
import { formatElapsedTime } from '../calculations';
import { RecordingPanel } from './RecordingPanel';
import { loadLastPhaseForProject } from '../persistence';
import type { Phase, Task } from '@/modules/planning';

type RecordButtonProps = {
  readonly projectId: string;
  readonly projectName: string;
  readonly clientId: string;
  readonly phases: readonly Phase[];
  readonly tasks: readonly Task[];
  readonly onEntrySaved: () => void;
};

export function RecordButton({ projectId, projectName, clientId, phases, tasks, onEntrySaved }: RecordButtonProps) {
  const { recording, isRecording, elapsedSeconds, startRecording, stopRecording } = useRecording();

  const isRecordingThisProject = isRecording && recording?.projectId === projectId;
  const isRecordingOtherProject = isRecording && recording?.projectId !== projectId;

  const handleStart = () => {
    const lastPhase = loadLastPhaseForProject(projectId);
    startRecording({
      projectId,
      projectName,
      clientId,
      phaseId: lastPhase,
    });
  };

  const handleStop = async () => {
    try {
      await stopRecording();
      onEntrySaved();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save recording';
      alert(message);
    }
  };

  // Recording another project — show disabled indicator
  if (isRecordingOtherProject) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-oat-300 bg-cream px-3 py-1.5 text-sm text-oat-500">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pomegranate-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-pomegranate-400" />
        </span>
        Recording on {recording?.projectName}
      </div>
    );
  }

  // Recording this project — show timer button + floating panel overlay
  if (isRecordingThisProject) {
    return (
      <>
        <button
          onClick={handleStop}
          className="flex items-center gap-2 rounded-lg bg-pomegranate-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-pomegranate-600/80"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pomegranate-300 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          {formatElapsedTime(elapsedSeconds)}
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>
        <RecordingPanel phases={phases} tasks={tasks} onStop={onEntrySaved} />
      </>
    );
  }

  // Not recording — show start button
  return (
    <button
      onClick={handleStart}
      className="flex items-center gap-2 rounded-lg bg-pomegranate-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-pomegranate-600/80"
    >
      <span className="flex h-3 w-3 items-center justify-center rounded-full bg-white">
        <span className="h-1.5 w-1.5 rounded-full bg-pomegranate-600" />
      </span>
      Record
    </button>
  );
}
