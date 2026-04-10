// Public API for recording module
export { RecordingProvider, useRecording } from './context/RecordingContext';
export { RecordButton } from './components/RecordButton';
export { RecordingPanel } from './components/RecordingPanel';
export { GlobalRecordingIndicator } from './components/GlobalRecordingIndicator';
export { RecordedTimeTable } from './components/RecordedTimeTable';
export { useRecordedEntries } from './hooks/useRecordedEntries';
export { formatElapsedTime, calculateDurationHours, getElapsedSeconds } from './calculations';
export type { RecordingState, RecordingContextValue } from './types';
