-- Add RLS to exchange_rates (missed in migration 008)
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users (shared cache)
CREATE POLICY "Authenticated users can read exchange_rates"
  ON exchange_rates FOR SELECT
  USING (auth.role() = 'authenticated');

-- No INSERT/UPDATE/DELETE policy for authenticated users
-- Only service role (via API route) can write
