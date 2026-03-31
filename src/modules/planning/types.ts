export type Phase = {
  readonly id: string;
  readonly project_id: string;
  readonly sub_project_id: string | null;
  readonly name: string;
  readonly display_order: number;
  readonly quoted_hours: number;
  readonly internal_planned_hours: number;
  readonly created_at: string;
  readonly user_id: string;
};

export type CreatePhaseInput = {
  readonly project_id: string;
  readonly sub_project_id?: string;
  readonly name: string;
  readonly quoted_hours?: number;
  readonly internal_planned_hours?: number;
  readonly display_order?: number;
};

export type UpdatePhaseInput = {
  readonly name?: string;
  readonly quoted_hours?: number;
  readonly internal_planned_hours?: number;
  readonly display_order?: number;
};

export type PlanningLayer = 'client' | 'internal';

export type ComparisonRow = {
  readonly phase: Phase;
  readonly quotedHours: number;
  readonly internalHours: number;
  readonly delta: number;
  readonly overBudget: boolean;
};
