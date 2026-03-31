export type PhaseLink = {
  readonly id: string;
  readonly project_id: string;
  readonly canonical_name: string;
  readonly budget_phase_id: string | null;
  readonly plan_phase_id: string | null;
  readonly user_id: string;
  readonly created_at: string;
};

export type CreatePhaseLinkInput = {
  readonly project_id: string;
  readonly canonical_name: string;
  readonly budget_phase_id?: string;
  readonly plan_phase_id?: string;
};

export type UpdatePhaseLinkInput = {
  readonly canonical_name?: string;
  readonly budget_phase_id?: string | null;
  readonly plan_phase_id?: string | null;
};

export type ComparisonRowData = {
  readonly canonicalName: string;
  readonly phaseLinkId: string;
  readonly budgetHours: number;
  readonly planHours: number;
  readonly actualHours: number;
  readonly remaining: number;
  readonly status: 'on_track' | 'warning' | 'over';
  readonly budgetPhaseName: string | null;
  readonly planPhaseName: string | null;
};

export type ComparisonSummary = {
  readonly totalBudget: number;
  readonly totalPlan: number;
  readonly totalActual: number;
  readonly percentConsumed: number;
  readonly status: 'on_track' | 'warning' | 'over';
};
