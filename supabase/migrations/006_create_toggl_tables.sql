-- Toggl connection (encrypted API token, workspace)
CREATE TABLE toggl_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_token_encrypted text NOT NULL,
  workspace_id text,
  workspace_name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error')),
  last_sync_at timestamptz,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE toggl_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own toggl_connections"
  ON toggl_connections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Toggl project → hub project mapping
CREATE TABLE toggl_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  toggl_project_id bigint NOT NULL,
  toggl_project_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_toggl_mappings_toggl_project ON toggl_mappings(toggl_project_id);
CREATE INDEX idx_toggl_mappings_project ON toggl_mappings(project_id);

ALTER TABLE toggl_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own toggl_mappings"
  ON toggl_mappings FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Cached Toggl time entries
CREATE TABLE toggl_cached_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  toggl_entry_id bigint NOT NULL UNIQUE,
  toggl_project_id bigint,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  phase_id uuid REFERENCES phases(id) ON DELETE SET NULL,
  phase_assignment_type text NOT NULL DEFAULT 'unassigned' CHECK (phase_assignment_type IN ('auto_keyword', 'manual', 'unassigned')),
  description text,
  start_time timestamptz NOT NULL,
  stop_time timestamptz,
  duration_seconds integer NOT NULL,
  duration_hours decimal(12,2) NOT NULL,
  billable boolean NOT NULL DEFAULT true,
  tags text[],
  fetched_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_toggl_entries_project ON toggl_cached_entries(project_id);
CREATE INDEX idx_toggl_entries_phase ON toggl_cached_entries(phase_id);
CREATE INDEX idx_toggl_entries_toggl_id ON toggl_cached_entries(toggl_entry_id);

ALTER TABLE toggl_cached_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own toggl_cached_entries"
  ON toggl_cached_entries FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
