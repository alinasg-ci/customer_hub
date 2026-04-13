'use client';

import { useState, useEffect, useRef } from 'react';
import { useRecording } from '../context/RecordingContext';
import { formatElapsedTime } from '../calculations';
import type { Phase, Task } from '@/modules/planning';

type RecordingPanelProps = {
  readonly phases: readonly Phase[];
  readonly tasks: readonly Task[];
  readonly onStop: () => void;
};

export function RecordingPanel({ phases, tasks, onStop }: RecordingPanelProps) {
  const { recording, elapsedSeconds, updateRecording, stopRecording } = useRecording();
  const [description, setDescription] = useState(recording?.description ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDescription(recording?.description ?? '');
  }, [recording?.description]);

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateRecording({ description: value });
    }, 500);
  };

  const handlePhaseChange = (phaseId: string | null) => {
    updateRecording({ phaseId, taskId: null });
  };

  const handleTaskChange = (taskId: string | null) => {
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        updateRecording({ taskId, phaseId: task.phase_id });
        return;
      }
    }
    updateRecording({ taskId });
  };

  const handleStop = async () => {
    try {
      await stopRecording();
      onStop();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save recording';
      alert(message);
    }
  };

  if (!recording) return null;

  const phaseTasks = recording.phaseId
    ? tasks.filter((t) => t.phase_id === recording.phaseId)
    : [];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-pomegranate-300 bg-white shadow-lg">
      <div className="mx-auto flex max-w-screen-xl items-center gap-4 px-6 py-3">
        {/* Timer */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pomegranate-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pomegranate-400" />
          </span>
          <span className="font-mono text-lg font-semibold text-black">
            {formatElapsedTime(elapsedSeconds)}
          </span>
        </div>

        {/* Phase */}
        <select
          value={recording.phaseId ?? ''}
          onChange={(e) => handlePhaseChange(e.target.value || null)}
          className="clay-input w-36 text-sm px-2.5 py-1.5"
        >
          <option value="">Phase...</option>
          {phases.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Task */}
        <select
          value={recording.taskId ?? ''}
          onChange={(e) => handleTaskChange(e.target.value || null)}
          disabled={!recording.phaseId}
          className="clay-input w-36 text-sm px-2.5 py-1.5 disabled:opacity-50"
        >
          <option value="">
            {!recording.phaseId ? 'Select phase first' : phaseTasks.length === 0 ? 'No tasks' : 'Task...'}
          </option>
          {phaseTasks.map((t) => (
            <option key={t.id} value={t.id}>{t.name || 'Untitled'}</option>
          ))}
        </select>

        {/* Description */}
        <input
          type="text"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="What are you working on?"
          className="clay-input flex-1 text-sm px-3 py-1.5"
        />

        {/* Billable */}
        <label className="flex items-center gap-1.5 text-sm text-charcoal-500 shrink-0">
          <input
            type="checkbox"
            checked={recording.billable}
            onChange={(e) => updateRecording({ billable: e.target.checked })}
            className="rounded border-oat-300"
          />
          Billable
        </label>

        {/* Stop */}
        <button
          onClick={handleStop}
          className="flex items-center gap-1.5 rounded-lg bg-pomegranate-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pomegranate-600/80 shrink-0"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
          Stop
        </button>
      </div>
    </div>
  );
}
