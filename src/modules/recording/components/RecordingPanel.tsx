'use client';

import { useState, useEffect, useRef } from 'react';
import { useRecording } from '../context/RecordingContext';
import { formatElapsedTime } from '../calculations';
import type { Phase, Task } from '@/modules/planning/types';

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
    // When phase changes, clear the task selection
    updateRecording({ phaseId, taskId: null });
  };

  const handleTaskChange = (taskId: string | null) => {
    if (taskId) {
      // When a task is selected, auto-set its phase
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        updateRecording({ taskId, phaseId: task.phase_id });
        return;
      }
    }
    updateRecording({ taskId });
  };

  const handleStop = async () => {
    await stopRecording();
    onStop();
  };

  if (!recording) return null;

  // Tasks filtered by selected phase
  const phaseTasks = recording.phaseId
    ? tasks.filter((t) => t.phase_id === recording.phaseId)
    : [];

  return (
    <div className="mt-3 rounded-xl border border-red-200 bg-red-50/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="font-mono text-lg font-semibold text-slate-900">
            {formatElapsedTime(elapsedSeconds)}
          </span>
        </div>
        <button
          onClick={handleStop}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
          Stop
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Phase</label>
            <select
              value={recording.phaseId ?? ''}
              onChange={(e) => handlePhaseChange(e.target.value || null)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            >
              <option value="">Unassigned</option>
              {phases.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Task</label>
            <select
              value={recording.taskId ?? ''}
              onChange={(e) => handleTaskChange(e.target.value || null)}
              disabled={!recording.phaseId}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 disabled:opacity-50"
            >
              <option value="">
                {!recording.phaseId
                  ? 'Select phase first'
                  : phaseTasks.length === 0
                    ? 'No tasks in phase'
                    : 'Select task'}
              </option>
              {phaseTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.name || 'Untitled'}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="What are you working on?"
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={recording.billable}
            onChange={(e) => updateRecording({ billable: e.target.checked })}
            className="rounded border-slate-300"
          />
          Billable
        </label>
      </div>
    </div>
  );
}
