-- Learned routing rules: "always route emails matching X → client Y / project Z".
-- Mirrors phase_keywords. Populated both manually (user_entered) and from
-- user corrections in /notifications (learned_from_correction).

CREATE TABLE IF NOT EXISTS email_routing_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_type   text NOT NULL
              CHECK (rule_type IN ('domain','sender_email','subject_pattern','body_keyword')),
  pattern     text NOT NULL,
  client_id   uuid NOT NULL REFERENCES clients(id)  ON DELETE CASCADE,
  project_id  uuid          REFERENCES projects(id) ON DELETE SET NULL,
  source      text NOT NULL DEFAULT 'user_entered'
              CHECK (source IN ('user_entered','learned_from_correction')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, rule_type, pattern)
);

CREATE INDEX IF NOT EXISTS email_routing_rules_user_id_idx   ON email_routing_rules (user_id);
CREATE INDEX IF NOT EXISTS email_routing_rules_client_id_idx ON email_routing_rules (client_id);
CREATE INDEX IF NOT EXISTS email_routing_rules_lookup_idx    ON email_routing_rules (user_id, rule_type, pattern);

ALTER TABLE email_routing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_routing_rules_owner_all
  ON email_routing_rules FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
