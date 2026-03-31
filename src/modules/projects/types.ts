import type { ProjectType, ProjectStatus, Currency, BillingPeriod } from '@/shared/types';

export type Project = {
  readonly id: string;
  readonly client_id: string;
  readonly name: string;
  readonly type: ProjectType;
  readonly status: ProjectStatus;
  readonly rate_per_hour: number | null;
  readonly rate_currency: Currency;
  readonly rate_exchange_rate: number | null;
  readonly rate_per_hour_ils: number | null;
  readonly total_scoped_hours: number | null;
  readonly total_fee: number | null;
  readonly total_fee_currency: Currency;
  readonly total_fee_ils: number | null;
  readonly deadline: string | null;
  readonly billing_period: BillingPeriod | null;
  readonly retainer_fee: number | null;
  readonly retainer_fee_currency: Currency;
  readonly retainer_fee_ils: number | null;
  readonly start_date: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly user_id: string;
};

export type SubProject = {
  readonly id: string;
  readonly project_id: string;
  readonly name: string;
  readonly description: string | null;
  readonly allocated_hours: number | null;
  readonly billed_hours: number | null;
  readonly created_at: string;
  readonly user_id: string;
};

export type CreateProjectInput = {
  readonly client_id: string;
  readonly name: string;
  readonly type: ProjectType;
  readonly rate_per_hour?: number;
  readonly rate_currency?: Currency;
  readonly total_scoped_hours?: number;
  readonly total_fee?: number;
  readonly total_fee_currency?: Currency;
  readonly deadline?: string;
  readonly billing_period?: BillingPeriod;
  readonly retainer_fee?: number;
  readonly retainer_fee_currency?: Currency;
  readonly start_date?: string;
};

export type UpdateProjectInput = Partial<Omit<CreateProjectInput, 'client_id' | 'type'>>;

export type CreateSubProjectInput = {
  readonly project_id: string;
  readonly name: string;
  readonly description?: string;
  readonly allocated_hours?: number;
  readonly billed_hours?: number;
};

export type UpdateSubProjectInput = Partial<Omit<CreateSubProjectInput, 'project_id'>>;
