import type { PhaseAssignmentType } from '@/shared/types';

export type TogglConnection = {
  readonly id: string;
  readonly api_token_encrypted: string;
  readonly workspace_id: string | null;
  readonly workspace_name: string | null;
  readonly status: 'active' | 'disconnected' | 'error';
  readonly last_sync_at: string | null;
  readonly user_id: string;
  readonly created_at: string;
};

export type TogglMapping = {
  readonly id: string;
  readonly project_id: string;
  readonly toggl_project_id: number;
  readonly toggl_project_name: string | null;
  readonly created_at: string;
  readonly user_id: string;
};

export type CachedTimeEntry = {
  readonly id: string;
  readonly toggl_entry_id: number;
  readonly toggl_project_id: number | null;
  readonly project_id: string | null;
  readonly phase_id: string | null;
  readonly phase_assignment_type: PhaseAssignmentType;
  readonly description: string | null;
  readonly start_time: string;
  readonly stop_time: string | null;
  readonly duration_seconds: number;
  readonly duration_hours: number;
  readonly billable: boolean;
  readonly tags: string[];
  readonly fetched_at: string;
  readonly user_id: string;
};

export type TogglWorkspace = {
  readonly id: number;
  readonly name: string;
};

export type TogglProject = {
  readonly id: number;
  readonly name: string;
  readonly workspace_id: number;
};

export type TogglTimeEntry = {
  readonly id: number;
  readonly workspace_id: number;
  readonly project_id: number | null;
  readonly description: string | null;
  readonly start: string;
  readonly stop: string | null;
  readonly duration: number;
  readonly billable: boolean;
  readonly tags: string[];
};

export type TimeEntry = {
  readonly id: string;
  readonly source: 'toggl' | 'manual' | 'recorded';
  readonly projectId: string | null;
  readonly phaseId: string | null;
  readonly subProjectId?: string | null;
  readonly taskId?: string | null;
  readonly description: string | null;
  readonly date: string;
  readonly durationHours: number;
  readonly billable: boolean;
  readonly assignmentType: PhaseAssignmentType;
};

export type SyncStatus = 'pending' | 'accepted' | 'excluded';

export type SyncPreviewEntry = {
  readonly toggl_entry_id: number;
  readonly description: string | null;
  readonly start_time: string;
  readonly duration_hours: number;
  readonly billable: boolean;
  readonly toggl_project_name: string | null;
  readonly proposed_project_id: string | null;
  readonly proposed_phase_id: string | null;
  readonly proposed_phase_name: string | null;
  action: 'accept' | 'reassign' | 'exclude';
  reassigned_phase_id: string | null;
};

export type TogglExclusion = {
  readonly id: string;
  readonly toggl_entry_id: number;
  readonly excluded_at: string;
  readonly user_id: string;
};
