-- ============================================
-- Agiliza AI - Supabase Schema
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- 1. Tabela de sistemas
CREATE TABLE IF NOT EXISTS systems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de cards
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('CS', 'Comercial', 'Tech')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  system_id UUID REFERENCES systems(id),
  area TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Bug', 'Inovação')),
  severity TEXT NOT NULL CHECK (severity IN ('Blocker', 'Major', 'Minor')),
  status TEXT NOT NULL DEFAULT 'a_fazer' CHECK (status IN ('a_fazer', 'em_progresso', 'concluido', 'aprovado', 'reprovado')),
  parent_card_id UUID REFERENCES cards(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de comentários
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('CS', 'Comercial', 'Tech')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de feedbacks (aprovação/reprovação)
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('aprovado', 'reprovado')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Seed: sistemas pré-cadastrados
INSERT INTO systems (name) VALUES
  ('QuizQuality'),
  ('Agilean Planner'),
  ('Mão de Obra'),
  ('Planner Web')
ON CONFLICT DO NOTHING;

-- 6. Ativar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cards;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 7. Políticas RLS (acesso público para simplificar)
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_access" ON systems FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_access" ON feedbacks FOR ALL USING (true) WITH CHECK (true);
