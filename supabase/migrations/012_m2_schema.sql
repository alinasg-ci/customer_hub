-- M2 Schema: Planning tables, Toggl sync preview, phase links, cascade fixes
-- Prerequisite: All M1 migrations (001-011) must be applied

-- =============================================================================
-- 1. Fix projects.client_id CASCADE (M1 was missing ON DELETE CASCADE)
-- =============================================================================
ALTER TABLE projects DROP CONSTRAINT projects_client_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Also fix toggl_cached_entries.project_id: change from SET NULL to CASCADE
-- so deleting a project cleans up its cached entries (not just nullifies them)
ALTER TABLE toggl_cached_entries DROP CONSTRAINT toggl_cached_entries_project_id_fkey;
ALTER TABLE toggl_cached_entries ADD CONSTRAINT toggl_cached_entries_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- =============================================================================
-- 2. Add sync_status to toggl_cached_entries (for sync preview workflow)
-- =============================================================================
ALTER TABLE toggl_cached_entries
  ADD COLUMN sync_status text NOT NULL DEFAULT 'accepted'
  CHECK (sync_status IN ('pending', 'accepted', 'excluded'));

-- =============================================================================
-- 3. Planning tables (one per project — internal project plan)
-- =============================================================================
CREATE TABLE planning_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Project Plan',
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_planning_tables_project ON planning_tables(project_id);
CREATE INDEX idx_planning_tables_client ON planning_tables(client_id);

ALTER TABLE planning_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own planning_tables"
  ON planning_tables FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER planning_tables_updated_at
  BEFORE UPDATE ON planning_tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 4. Planning rows (hierarchical, 3 levels max)
-- =============================================================================
CREATE TABLE planning_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_table_id uuid NOT NULL REFERENCES planning_tables(id) ON DELETE CASCADE,
  parent_row_id uuid REFERENCES planning_rows(id) ON DELETE CASCADE,
  level integer NOT NULL CHECK (level BETWEEN 1 AND 3),
  name text NOT NULL,
  content text,
  start_date date,
  end_date date,
  color text,
  display_order integer NOT NULL DEFAULT 0,
  linked_phase_id uuid REFERENCES phases(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_planning_rows_table ON planning_rows(planning_table_id);
CREATE INDEX idx_planning_rows_parent ON planning_rows(parent_row_id);
CREATE INDEX idx_planning_rows_order ON planning_rows(planning_table_id, display_order);

ALTER TABLE planning_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own planning_rows"
  ON planning_rows FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER planning_rows_updated_at
  BEFORE UPDATE ON planning_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 5. Toggl exclusions (entries the user chose to skip during sync preview)
-- =============================================================================
CREATE TABLE toggl_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  toggl_entry_id bigint NOT NULL UNIQUE,
  excluded_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE toggl_exclusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own toggl_exclusions"
  ON toggl_exclusions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 6. Phase links (canonical phase grouping for budget vs plan vs actual)
-- =============================================================================
CREATE TABLE phase_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  canonical_name text NOT NULL,
  budget_phase_id uuid REFERENCES phases(id) ON DELETE SET NULL,
  plan_phase_id uuid REFERENCES phases(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_phase_links_project ON phase_links(project_id);

ALTER TABLE phase_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own phase_links"
  ON phase_links FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
