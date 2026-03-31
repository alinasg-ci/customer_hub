export type PlanningTable = {
  readonly id: string;
  readonly project_id: string;
  readonly client_id: string;
  readonly name: string;
  readonly user_id: string;
  readonly created_at: string;
  readonly updated_at: string;
};

export type PlanningRow = {
  readonly id: string;
  readonly planning_table_id: string;
  readonly parent_row_id: string | null;
  readonly level: 1 | 2 | 3;
  readonly name: string;
  readonly content: string | null;
  readonly start_date: string | null;
  readonly end_date: string | null;
  readonly color: string | null;
  readonly display_order: number;
  readonly linked_phase_id: string | null;
  readonly user_id: string;
  readonly created_at: string;
  readonly updated_at: string;
};

export type CreatePlanningRowInput = {
  readonly planning_table_id: string;
  readonly parent_row_id?: string;
  readonly level: 1 | 2 | 3;
  readonly name: string;
  readonly content?: string;
  readonly start_date?: string;
  readonly end_date?: string;
  readonly color?: string;
  readonly display_order?: number;
};

export type UpdatePlanningRowInput = {
  readonly name?: string;
  readonly content?: string | null;
  readonly start_date?: string | null;
  readonly end_date?: string | null;
  readonly color?: string | null;
  readonly display_order?: number;
  readonly linked_phase_id?: string | null;
  readonly parent_row_id?: string | null;
  readonly level?: 1 | 2 | 3;
};

export type PlanningRowTree = PlanningRow & {
  readonly children: readonly PlanningRowTree[];
};
