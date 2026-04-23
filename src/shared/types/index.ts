export type Currency = 'ILS' | 'USD' | 'EUR';

export type MoneyAmount = {
  readonly amount: number;
  readonly currency: Currency;
  readonly exchangeRate: number | null;
  readonly exchangeRateDate: string | null;
  readonly amountIls: number;
};

export type ProjectType = 'project' | 'retainer' | 'hour_bank';
export type ProjectStatus = 'active' | 'pending' | 'closed';
export type ClientStatus = 'active' | 'archived';
export type BillingPeriod = 'monthly' | 'quarterly';
export type ExpenseCategory = 'software' | 'outsourcing' | 'travel' | 'other';
export type PhaseAssignmentType = 'auto_keyword' | 'manual' | 'unassigned';
export type NotificationType =
  | 'over_budget_warning'
  | 'over_budget_exceeded'
  | 'bank_depleting'
  | 'bank_depleted'
  | 'deadline_approaching'
  | 'deadline_overdue'
  | 'email_routing_needed'
  | 'email_hours_suggestion';
export type NoteParentType = 'phase' | 'time_entry' | 'expense' | 'project' | 'sub_project';
export type KeywordSource = 'user_entered' | 'learned_from_correction';
