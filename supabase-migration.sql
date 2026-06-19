-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS kanbans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('CS', 'Comercial')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cards ADD COLUMN IF NOT EXISTS kanban_id UUID REFERENCES kanbans(id) ON DELETE CASCADE;

INSERT INTO kanbans (name, role) VALUES ('Geral', 'CS'), ('Geral', 'Comercial')
ON CONFLICT DO NOTHING;

UPDATE cards SET kanban_id = (SELECT id FROM kanbans WHERE role = cards.role LIMIT 1) WHERE kanban_id IS NULL;
