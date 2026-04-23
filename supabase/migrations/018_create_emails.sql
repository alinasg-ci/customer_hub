-- Emails table: one row per Gmail message (incl. manually added ones).
-- Bodies are AES-256 encrypted at rest (EMAIL_ENCRYPTION_KEY).
-- client_id / project_id nullable: null client_id = "unrouted" (surfaced as
-- a notification, resolved from /notifications, never logged).

CREATE TABLE IF NOT EXISTS email_threads (
  gmail_thread_id    text PRIMARY KEY,
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject            text,
  last_message_at    timestamptz,
  message_count      integer NOT NULL DEFAULT 1,
  client_id          uuid REFERENCES clients(id)  ON DELETE SET NULL,
  project_id         uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_threads_user_id_idx    ON email_threads (user_id);
CREATE INDEX IF NOT EXISTS email_threads_client_id_idx  ON email_threads (client_id);
CREATE INDEX IF NOT EXISTS email_threads_project_id_idx ON email_threads (project_id);

ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_threads_owner_all
  ON email_threads FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


CREATE TABLE IF NOT EXISTS emails (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id            text,
  gmail_thread_id             text REFERENCES email_threads(gmail_thread_id) ON DELETE SET NULL,
  from_email                  text NOT NULL,
  from_name                   text,
  to_emails                   text[] NOT NULL DEFAULT '{}',
  cc_emails                   text[] NOT NULL DEFAULT '{}',
  subject                     text,
  snippet                     text,
  body_encrypted              text,  -- AES-256-GCM base64 (see src/shared/utils/crypto.ts)
  sent_at                     timestamptz,
  client_id                   uuid REFERENCES clients(id)  ON DELETE SET NULL,
  project_id                  uuid REFERENCES projects(id) ON DELETE SET NULL,
  routing_source              text NOT NULL DEFAULT 'unrouted'
                              CHECK (routing_source IN ('domain','contact','client_name','learned_rule','llm','manual','unrouted')),
  routing_confidence          numeric(3,2),
  routing_reasoning           text,
  is_manual                   boolean NOT NULL DEFAULT false,
  mentions_hours              boolean NOT NULL DEFAULT false,
  hours_suggestion_amount     numeric(6,2),
  hours_suggestion_date       date,
  hours_suggestion_description text,
  hours_suggestion_snippet    text,
  hours_logged_entry_id       uuid,  -- set after the user confirms a time entry
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  -- Gmail dedupes by message id when ingested from Gmail (null for manual rows).
  UNIQUE (user_id, gmail_message_id)
);

CREATE INDEX IF NOT EXISTS emails_user_id_idx         ON emails (user_id);
CREATE INDEX IF NOT EXISTS emails_client_id_idx       ON emails (client_id);
CREATE INDEX IF NOT EXISTS emails_project_id_idx      ON emails (project_id);
CREATE INDEX IF NOT EXISTS emails_thread_id_idx       ON emails (gmail_thread_id);
CREATE INDEX IF NOT EXISTS emails_routing_source_idx  ON emails (routing_source);
CREATE INDEX IF NOT EXISTS emails_sent_at_idx         ON emails (sent_at DESC);
CREATE INDEX IF NOT EXISTS emails_unrouted_partial    ON emails (user_id, sent_at DESC)
  WHERE routing_source = 'unrouted';

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY emails_owner_all
  ON emails FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION set_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS emails_set_updated_at ON emails;
CREATE TRIGGER emails_set_updated_at
  BEFORE UPDATE ON emails
  FOR EACH ROW EXECUTE FUNCTION set_emails_updated_at();

DROP TRIGGER IF EXISTS email_threads_set_updated_at ON email_threads;
CREATE TRIGGER email_threads_set_updated_at
  BEFORE UPDATE ON email_threads
  FOR EACH ROW EXECUTE FUNCTION set_emails_updated_at();
