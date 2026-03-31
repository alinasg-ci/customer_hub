-- Create projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('project', 'retainer', 'hour_bank')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'closed')),
  rate_per_hour decimal(12,2),
  rate_currency text NOT NULL DEFAULT 'ILS' CHECK (rate_currency IN ('ILS', 'USD', 'EUR')),
  rate_exchange_rate decimal(12,6),
  rate_per_hour_ils decimal(12,2),
  total_scoped_hours decimal(12,2),
  total_fee decimal(12,2),
  total_fee_currency text NOT NULL DEFAULT 'ILS' CHECK (total_fee_currency IN ('ILS', 'USD', 'EUR')),
  total_fee_ils decimal(12,2),
  deadline date,
  billing_period text CHECK (billing_period IN ('monthly', 'quarterly')),
  retainer_fee decimal(12,2),
  retainer_fee_currency text NOT NULL DEFAULT 'ILS' CHECK (retainer_fee_currency IN ('ILS', 'USD', 'EUR')),
  retainer_fee_ils decimal(12,2),
  start_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_user_status ON projects(user_id, status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own projects"
  ON projects
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create sub_projects table (for hour_bank type only)
CREATE TABLE sub_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  allocated_hours decimal(12,2),
  billed_hours decimal(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_sub_projects_project ON sub_projects(project_id);

ALTER TABLE sub_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sub_projects"
  ON sub_projects
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-update updated_at on projects
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
