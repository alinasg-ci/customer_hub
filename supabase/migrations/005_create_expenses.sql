-- Create expenses table
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES phases(id) ON DELETE SET NULL,
  sub_project_id uuid REFERENCES sub_projects(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount decimal(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'ILS' CHECK (currency IN ('ILS', 'USD', 'EUR')),
  exchange_rate_used decimal(12,6),
  exchange_rate_date date,
  amount_ils decimal(12,2) NOT NULL,
  date date NOT NULL,
  category text NOT NULL CHECK (category IN ('software', 'outsourcing', 'travel', 'other')),
  attachment_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_expenses_project ON expenses(project_id);
CREATE INDEX idx_expenses_phase ON expenses(phase_id);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own expenses"
  ON expenses
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
