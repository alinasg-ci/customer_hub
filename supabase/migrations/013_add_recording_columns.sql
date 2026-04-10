-- Add start_time and end_time to manual_time_entries for native time recording.
-- Recorded entries have both fields set; manually-added entries leave them NULL.

ALTER TABLE manual_time_entries
  ADD COLUMN start_time timestamptz,
  ADD COLUMN end_time timestamptz;
