-- Create clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

-- Index for filtering by user and status
CREATE INDEX idx_clients_user_status ON clients(user_id, status);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only access their own clients
CREATE POLICY "Users can manage their own clients"
  ON clients
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
