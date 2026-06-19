-- Add resolved_by column
ALTER TABLE cards ADD COLUMN IF NOT EXISTS resolved_by TEXT;

-- Update severity CHECK constraint to accept new values
ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_severity_check;
ALTER TABLE cards ADD CONSTRAINT cards_severity_check CHECK (severity IN ('bug', 'melhoria', 'sugestao', 'Blocker', 'Major', 'Minor'));
