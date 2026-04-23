-- Per-user Gmail OAuth connection. Mirrors toggl_connections.
-- Long-lived refresh token is AES-256 encrypted (EMAIL_ENCRYPTION_KEY).
-- history_id enables incremental Gmail sync (users.history.list).

CREATE TABLE IF NOT EXISTS gmail_connections (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email               text NOT NULL,
  refresh_token_encrypted    text NOT NULL,
  access_token_cached        text,
  access_token_expires_at    timestamptz,
  history_id                 text,
  last_sync_at               timestamptz,
  last_error                 text,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS gmail_connections_user_id_idx ON gmail_connections (user_id);

ALTER TABLE gmail_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY gmail_connections_owner_select
  ON gmail_connections FOR SELECT USING (user_id = auth.uid());
CREATE POLICY gmail_connections_owner_insert
  ON gmail_connections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY gmail_connections_owner_update
  ON gmail_connections FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY gmail_connections_owner_delete
  ON gmail_connections FOR DELETE USING (user_id = auth.uid());

-- Keep updated_at fresh.
CREATE OR REPLACE FUNCTION set_gmail_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gmail_connections_set_updated_at ON gmail_connections;
CREATE TRIGGER gmail_connections_set_updated_at
  BEFORE UPDATE ON gmail_connections
  FOR EACH ROW EXECUTE FUNCTION set_gmail_connections_updated_at();
