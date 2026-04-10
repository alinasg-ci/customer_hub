export type RecordingState = {
  readonly projectId: string;
  readonly projectName: string;
  readonly clientId: string;
  readonly startedAt: string;
  readonly phaseId: string | null;
  readonly taskId: string | null;
  readonly description: string;
  readonly billable: boolean;
};

export type RecordingContextValue = {
  readonly recording: RecordingState | null;
  readonly isRecording: boolean;
  readonly elapsedSeconds: number;
  readonly startRecording: (params: {
    projectId: string;
    projectName: string;
    clientId: string;
    phaseId: string | null;
  }) => void;
  readonly stopRecording: () => Promise<void>;
  readonly updateRecording: (fields: Partial<Pick<RecordingState, 'description' | 'billable' | 'phaseId' | 'taskId'>>) => void;
};
