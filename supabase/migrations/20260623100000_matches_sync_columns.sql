-- Migration: Adiciona colunas de cache e dados visuais na tabela matches
-- Descrição: Suporte ao Card 6 — Integração com football-data.org
-- IMPORTANTE: Execute este script no SQL Editor do Supabase Dashboard

-- 1. Novas colunas na tabela matches
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS matchday INTEGER,
  ADD COLUMN IF NOT EXISTS home_team_crest TEXT,
  ADD COLUMN IF NOT EXISTS away_team_crest TEXT,
  ADD COLUMN IF NOT EXISTS group_name TEXT;

-- 2. Índice para buscar jogos por data (performance na listagem diária)
CREATE INDEX IF NOT EXISTS idx_matches_kickoff_at ON public.matches (kickoff_at);

-- 3. Índice para buscar jogos por status (filtrar live/scheduled/finished)
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches (status);

-- 4. Política RLS para permitir INSERT na tabela matches (sincronização via servidor)
-- O servidor usa service_role que bypassa RLS, mas caso precise rodar via anon_key:
CREATE POLICY "Service can insert matches"
  ON public.matches FOR INSERT
  WITH CHECK (true);

-- 5. Política RLS para permitir UPDATE na tabela matches (atualizar placares)
CREATE POLICY "Service can update matches"
  ON public.matches FOR UPDATE
  USING (true);
