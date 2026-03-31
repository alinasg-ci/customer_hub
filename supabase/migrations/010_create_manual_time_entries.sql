-- Manual time entries (hours not tracked in Toggl)
CREATE TABLE manual_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES phases(id) ON DELETE SET NULL,
  sub_project_id uuid REFERENCES sub_projects(id) ON DELETE SET NULL,
  date date NOT NULL,
  hours decimal(12,2) NOT NULL,
  description text,
  billable boolean NOT NULL DEFAULT true,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_manual_entries_project ON manual_time_entries(project_id);

ALTER TABLE manual_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own manual_time_entries"
  ON manual_time_entries
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
