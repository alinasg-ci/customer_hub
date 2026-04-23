-- Extend notifications.type to cover the two new email-driven flows:
--   email_routing_needed: an email could not be auto-routed to a client.
--                         Row is deduped to one per gmail_thread_id.
--   email_hours_suggestion: the LLM detected a mention of worked hours on a
--                           routed project; user can Review to prefill a
--                           time entry.

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'over_budget_warning',
      'over_budget_exceeded',
      'bank_depleting',
      'bank_depleted',
      'deadline_approaching',
      'deadline_overdue',
      'email_routing_needed',
      'email_hours_suggestion'
    ));

-- Optional FK so a notification can point to the email that produced it.
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS email_id uuid REFERENCES emails(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS notifications_email_id_idx ON notifications (email_id);
