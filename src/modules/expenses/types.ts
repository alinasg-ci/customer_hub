import type { Currency, ExpenseCategory } from '@/shared/types';

export type Expense = {
  readonly id: string;
  readonly project_id: string;
  readonly phase_id: string | null;
  readonly sub_project_id: string | null;
  readonly description: string;
  readonly amount: number;
  readonly currency: Currency;
  readonly exchange_rate_used: number | null;
  readonly exchange_rate_date: string | null;
  readonly amount_ils: number;
  readonly date: string;
  readonly category: ExpenseCategory;
  readonly attachment_link: string | null;
  readonly created_at: string;
  readonly user_id: string;
};

export type CreateExpenseInput = {
  readonly project_id: string;
  readonly phase_id?: string;
  readonly sub_project_id?: string;
  readonly description: string;
  readonly amount: number;
  readonly currency?: Currency;
  readonly date: string;
  readonly category: ExpenseCategory;
  readonly attachment_link?: string;
};
