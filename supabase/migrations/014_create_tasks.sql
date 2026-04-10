-- Tasks table: children of phases, used in My Planning view
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  planned_hours decimal(12,2) NOT NULL DEFAULT 0,
  internal_use boolean NOT NULL DEFAULT false,
  due_date date,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_tasks_phase ON tasks(phase_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_order ON tasks(phase_id, display_order);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks"
  ON tasks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add task_id to manual_time_entries so recorded time can be assigned to a task
ALTER TABLE manual_time_entries
  ADD COLUMN task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;
