-- Add deadline_approaching and deadline_overdue to notification type constraint
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
      'deadline_overdue'
    ));
