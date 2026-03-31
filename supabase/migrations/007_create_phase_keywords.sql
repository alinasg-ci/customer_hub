-- Phase keyword mapping for auto-assigning Toggl entries to phases
CREATE TABLE phase_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  source text NOT NULL DEFAULT 'user_entered' CHECK (source IN ('user_entered', 'learned_from_correction')),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX idx_phase_keywords_phase ON phase_keywords(phase_id);

ALTER TABLE phase_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own phase_keywords"
  ON phase_keywords
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
