-- Migration applied via: supabase db push --linked
-- File: supabase/migrations/20260619054959_add_resolved_by_and_severity_types.sql

ALTER TABLE cards ADD COLUMN IF NOT EXISTS resolved_by TEXT;

ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_severity_check;
ALTER TABLE cards ADD CONSTRAINT cards_severity_check
  CHECK (severity IN ('bug', 'melhoria', 'sugestao', 'Blocker', 'Major', 'Minor'));
