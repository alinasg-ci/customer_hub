import type { RecordingState } from './types';

const RECORDING_KEY = 'recording_active';
const LAST_PHASE_PREFIX = 'recording_last_phase_';

export function saveRecordingState(state: RecordingState): void {
  try {
    localStorage.setItem(RECORDING_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable (private browsing) — recording still works in-memory
  }
}

export function loadRecordingState(): RecordingState | null {
  try {
    const raw = localStorage.getItem(RECORDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.projectId || !parsed.startedAt) return null;
    return parsed as RecordingState;
  } catch {
    return null;
  }
}

export function clearRecordingState(): void {
  try {
    localStorage.removeItem(RECORDING_KEY);
  } catch {
    // Ignore
  }
}

export function saveLastPhaseForProject(projectId: string, phaseId: string): void {
  try {
    localStorage.setItem(`${LAST_PHASE_PREFIX}${projectId}`, phaseId);
  } catch {
    // Ignore
  }
}

export function loadLastPhaseForProject(projectId: string): string | null {
  try {
    return localStorage.getItem(`${LAST_PHASE_PREFIX}${projectId}`);
  } catch {
    return null;
  }
}
