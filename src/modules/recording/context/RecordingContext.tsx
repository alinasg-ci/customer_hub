'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createManualEntry } from '@/modules/reports';
import { calculateDurationHours, getElapsedSeconds } from '../calculations';
import {
  saveRecordingState,
  loadRecordingState,
  clearRecordingState,
  saveLastPhaseForProject,
  loadLastPhaseForProject,
} from '../persistence';
import type { RecordingState, RecordingContextValue } from '../types';

const STALE_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 hours

const RecordingContext = createContext<RecordingContextValue | null>(null);

export function useRecording(): RecordingContextValue {
  const ctx = useContext(RecordingContext);
  if (!ctx) throw new Error('useRecording must be used within RecordingProvider');
  return ctx;
}

export function RecordingProvider({ children }: { readonly children: React.ReactNode }) {
  const [recording, setRecording] = useState<RecordingState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stalePrompt, setStalePrompt] = useState<RecordingState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load recording from localStorage on mount
  useEffect(() => {
    const saved = loadRecordingState();
    if (!saved) return;

    const elapsed = Date.now() - new Date(saved.startedAt).getTime();
    if (elapsed > STALE_THRESHOLD_MS) {
      setStalePrompt(saved);
    } else {
      setRecording(saved);
      setElapsedSeconds(getElapsedSeconds(saved.startedAt));
    }
  }, []);

  // Tick elapsed seconds every second when recording
  useEffect(() => {
    if (!recording) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsedSeconds(0);
      return;
    }

    setElapsedSeconds(getElapsedSeconds(recording.startedAt));
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(getElapsedSeconds(recording.startedAt));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [recording]);

  // Warn on tab close when recording
  useEffect(() => {
    if (!recording) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [recording]);

  const startRecording = useCallback((params: {
    projectId: string;
    projectName: string;
    clientId: string;
    phaseId: string | null;
  }) => {
    if (recording) throw new Error('A recording is already active');

    const defaultPhase = params.phaseId ?? loadLastPhaseForProject(params.projectId);
    const state: RecordingState = {
      projectId: params.projectId,
      projectName: params.projectName,
      clientId: params.clientId,
      startedAt: new Date().toISOString(),
      phaseId: defaultPhase,
      taskId: null,
      description: '',
      billable: true,
    };

    setRecording(state);
    saveRecordingState(state);
  }, [recording]);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    const endTime = new Date().toISOString();
    const durationHours = calculateDurationHours(recording.startedAt, endTime);

    // Save entry first — only clear state on success to prevent data loss
    await createManualEntry({
      project_id: recording.projectId,
      phase_id: recording.phaseId ?? undefined,
      task_id: recording.taskId ?? undefined,
      date: recording.startedAt.split('T')[0],
      hours: durationHours,
      description: recording.description || undefined,
      billable: recording.billable,
      start_time: recording.startedAt,
      end_time: endTime,
    });

    // Only clear after successful save
    clearRecordingState();
    setRecording(null);
  }, [recording]);

  const updateRecording = useCallback((fields: Partial<Pick<RecordingState, 'description' | 'billable' | 'phaseId' | 'taskId'>>) => {
    setRecording((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...fields };

      if (fields.phaseId && fields.phaseId !== prev.phaseId) {
        saveLastPhaseForProject(prev.projectId, fields.phaseId);
      }

      saveRecordingState(updated);
      return updated;
    });
  }, []);

  const handleResumeStale = useCallback(() => {
    if (!stalePrompt) return;
    setRecording(stalePrompt);
    setElapsedSeconds(getElapsedSeconds(stalePrompt.startedAt));
    setStalePrompt(null);
  }, [stalePrompt]);

  const handleDiscardStale = useCallback(() => {
    clearRecordingState();
    setStalePrompt(null);
  }, []);

  const value: RecordingContextValue = {
    recording,
    isRecording: recording !== null,
    elapsedSeconds,
    startRecording,
    stopRecording,
    updateRecording,
  };

  return (
    <RecordingContext.Provider value={value}>
      {children}

      {/* Stale recording recovery dialog */}
      {stalePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-oat-300 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-black">Unsaved recording found</h3>
            <p className="mt-2 text-sm text-charcoal-500">
              You have a recording on <strong>{stalePrompt.projectName}</strong> that started{' '}
              {new Date(stalePrompt.startedAt).toLocaleString()}. Resume or discard it?
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={handleDiscardStale}
                className="rounded-lg border border-oat-300 px-4 py-2 text-sm font-medium text-charcoal-700 hover:bg-cream"
              >
                Discard
              </button>
              <button
                onClick={handleResumeStale}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-900"
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </RecordingContext.Provider>
  );
}
