-- Gmail integration prerequisite: let clients own an explicit list of email
-- domains and contact addresses. These are used by the routing pipeline's
-- Layers 1 (domain) and 2 (contact) before any LLM call.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS email_domains  text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contact_emails text[] NOT NULL DEFAULT '{}';

-- Quick lookup indexes for the routing fast path.
CREATE INDEX IF NOT EXISTS clients_email_domains_gin  ON clients USING gin (email_domains);
CREATE INDEX IF NOT EXISTS clients_contact_emails_gin ON clients USING gin (contact_emails);
