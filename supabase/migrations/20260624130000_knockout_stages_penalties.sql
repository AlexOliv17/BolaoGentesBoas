-- 20260624130000_knockout_stages_penalties.sql

-- Adicionar colunas na tabela matches
ALTER TABLE public.matches
  ADD COLUMN stage TEXT NOT NULL DEFAULT 'GROUP_STAGE',
  ADD COLUMN penalty_winner TEXT CHECK (penalty_winner IN ('home', 'away', null));

-- Adicionar coluna na tabela predictions
ALTER TABLE public.predictions
  ADD COLUMN penalty_winner_guess TEXT CHECK (penalty_winner_guess IN ('home', 'away', null));
