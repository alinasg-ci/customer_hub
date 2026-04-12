export type CalendarEntry = {
  readonly id: string;
  readonly date: string;
  readonly startTime: string | null;
  readonly endTime: string | null;
  readonly durationHours: number;
  readonly description: string | null;
  readonly clientId: string | null;
  readonly clientName: string;
  readonly projectId: string | null;
  readonly projectName: string;
  readonly phaseName: string | null;
  readonly taskName: string | null;
  readonly billable: boolean;
};

export type ViewMode = 'day' | 'week' | 'month';
export type DisplayMode = 'calendar' | 'list';
