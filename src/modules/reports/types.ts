export type ReportEntry = {
  readonly id: string;
  readonly source: 'toggl' | 'manual';
  readonly date: string;
  readonly description: string;
  readonly hours: number;
  readonly billable: boolean;
  readonly phaseId: string | null;
  readonly phaseName: string | null;
};

export type GroupBy = 'phase' | 'date' | 'description' | 'billable';
export type SortBy = 'date' | 'hours' | 'description';
export type SortDir = 'asc' | 'desc';

export type ReportFilter = {
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly phaseId?: string;
  readonly billable?: boolean;
};

export type GroupedEntries = {
  readonly groupKey: string;
  readonly groupLabel: string;
  readonly entries: readonly ReportEntry[];
  readonly totalHours: number;
};

export type ManualTimeEntry = {
  readonly id: string;
  readonly project_id: string;
  readonly phase_id: string | null;
  readonly sub_project_id: string | null;
  readonly date: string;
  readonly hours: number;
  readonly description: string | null;
  readonly billable: boolean;
  readonly note: string | null;
  readonly start_time: string | null;
  readonly end_time: string | null;
  readonly task_id: string | null;
  readonly created_at: string;
  readonly user_id: string;
};

export type CreateManualEntryInput = {
  readonly project_id: string;
  readonly phase_id?: string;
  readonly date: string;
  readonly hours: number;
  readonly description?: string;
  readonly billable?: boolean;
  readonly note?: string;
  readonly start_time?: string;
  readonly end_time?: string;
  readonly task_id?: string;
};

export type UpdateManualEntryInput = {
  readonly phase_id?: string | null;
  readonly date?: string;
  readonly hours?: number;
  readonly description?: string | null;
  readonly billable?: boolean;
  readonly note?: string | null;
};
