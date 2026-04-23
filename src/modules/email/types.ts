import type { RoutingSource } from './api/routing';

export type EmailRow = {
  readonly id: string;
  readonly user_id: string;
  readonly gmail_message_id: string | null;
  readonly gmail_thread_id: string | null;
  readonly from_email: string;
  readonly from_name: string | null;
  readonly to_emails: readonly string[];
  readonly cc_emails: readonly string[];
  readonly subject: string | null;
  readonly snippet: string | null;
  readonly sent_at: string | null;
  readonly client_id: string | null;
  readonly project_id: string | null;
  readonly routing_source: RoutingSource;
  readonly routing_confidence: number | null;
  readonly routing_reasoning: string | null;
  readonly is_manual: boolean;
  readonly mentions_hours: boolean;
  readonly hours_suggestion_amount: number | null;
  readonly hours_suggestion_date: string | null;
  readonly hours_suggestion_description: string | null;
  readonly hours_suggestion_snippet: string | null;
  readonly hours_logged_entry_id: string | null;
  readonly created_at: string;
};

export type ManualEmailInput = {
  readonly from_email: string;
  readonly from_name?: string;
  readonly to_emails?: readonly string[];
  readonly subject: string;
  readonly body: string;
  readonly sent_at: string;
  readonly client_id: string;
  readonly project_id: string | null;
};
