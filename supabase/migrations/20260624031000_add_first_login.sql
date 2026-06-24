-- Adiciona o controle de primeiro login para exibir o modal de regras
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_login BOOLEAN NOT NULL DEFAULT true;
