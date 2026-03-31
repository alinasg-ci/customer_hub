-- Create phases table
CREATE TABLE phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sub_project_id uuid REFERENCES sub_projects(id) ON DELETE SET NULL,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  quoted_hours decimal(12,2) NOT NULL DEFAULT 0,
  internal_planned_hours decimal(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_phases_project ON phases(project_id);
CREATE INDEX idx_phases_order ON phases(project_id, display_order);

ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own phases"
  ON phases
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
