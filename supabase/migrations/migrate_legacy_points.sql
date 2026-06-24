DO $$
DECLARE
  v_pool_id UUID := '6257fb4b-90a8-4cad-b9cf-e20ae357bb7a';
  v_match_id BIGINT := 999999;
BEGIN
  -- 1. Cria o Jogo Fantasma
  INSERT INTO public.matches (id, home_team, away_team, kickoff_at, status, home_score, away_score, stage)
  VALUES (
    v_match_id, 
    'Pontuação', 
    'Legada', 
    '2026-06-01T00:00:00Z', 
    'finished', 
    0, 
    0,
    'GROUP_STAGE'
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Insere os palpites (com a pontuação legada) para cada usuário do bolão
  
  -- rypster_rapadura -> 27 pts
  INSERT INTO public.predictions (user_id, pool_id, match_id, home_guess, away_guess, points)
  SELECT id, v_pool_id, v_match_id, 0, 0, 27 FROM public.profiles WHERE username = 'rypster_rapadura'
  ON CONFLICT (pool_id, user_id, match_id) DO UPDATE SET points = EXCLUDED.points;

  -- lexzincrystalballs -> 31 pts
  INSERT INTO public.predictions (user_id, pool_id, match_id, home_guess, away_guess, points)
  SELECT id, v_pool_id, v_match_id, 0, 0, 31 FROM public.profiles WHERE username = 'lexzincrystalballs'
  ON CONFLICT (pool_id, user_id, match_id) DO UPDATE SET points = EXCLUDED.points;

  -- antonio -> 24 pts
  INSERT INTO public.predictions (user_id, pool_id, match_id, home_guess, away_guess, points)
  SELECT id, v_pool_id, v_match_id, 0, 0, 24 FROM public.profiles WHERE username = 'antonio'
  ON CONFLICT (pool_id, user_id, match_id) DO UPDATE SET points = EXCLUDED.points;

  -- vinimartinsocara -> 31 pts
  INSERT INTO public.predictions (user_id, pool_id, match_id, home_guess, away_guess, points)
  SELECT id, v_pool_id, v_match_id, 0, 0, 31 FROM public.profiles WHERE username = 'vinimartinsocara'
  ON CONFLICT (pool_id, user_id, match_id) DO UPDATE SET points = EXCLUDED.points;

  -- savio_martins03 -> 27 pts
  INSERT INTO public.predictions (user_id, pool_id, match_id, home_guess, away_guess, points)
  SELECT id, v_pool_id, v_match_id, 0, 0, 27 FROM public.profiles WHERE username = 'savio_martins03'
  ON CONFLICT (pool_id, user_id, match_id) DO UPDATE SET points = EXCLUDED.points;

  -- rafaelpablo030703 -> 28 pts
  INSERT INTO public.predictions (user_id, pool_id, match_id, home_guess, away_guess, points)
  SELECT id, v_pool_id, v_match_id, 0, 0, 28 FROM public.profiles WHERE username = 'rafaelpablo030703'
  ON CONFLICT (pool_id, user_id, match_id) DO UPDATE SET points = EXCLUDED.points;

  -- pedavila12 -> 23 pts
  INSERT INTO public.predictions (user_id, pool_id, match_id, home_guess, away_guess, points)
  SELECT id, v_pool_id, v_match_id, 0, 0, 23 FROM public.profiles WHERE username = 'pedavila12'
  ON CONFLICT (pool_id, user_id, match_id) DO UPDATE SET points = EXCLUDED.points;

  -- math23euss -> 32 pts
  INSERT INTO public.predictions (user_id, pool_id, match_id, home_guess, away_guess, points)
  SELECT id, v_pool_id, v_match_id, 0, 0, 32 FROM public.profiles WHERE username = 'math23euss'
  ON CONFLICT (pool_id, user_id, match_id) DO UPDATE SET points = EXCLUDED.points;

  -- nogdascrema -> 31 pts
  INSERT INTO public.predictions (user_id, pool_id, match_id, home_guess, away_guess, points)
  SELECT id, v_pool_id, v_match_id, 0, 0, 31 FROM public.profiles WHERE username = 'nogdascrema'
  ON CONFLICT (pool_id, user_id, match_id) DO UPDATE SET points = EXCLUDED.points;

  -- yuriabrahao -> 31 pts
  INSERT INTO public.predictions (user_id, pool_id, match_id, home_guess, away_guess, points)
  SELECT id, v_pool_id, v_match_id, 0, 0, 31 FROM public.profiles WHERE username = 'yuriabrahao'
  ON CONFLICT (pool_id, user_id, match_id) DO UPDATE SET points = EXCLUDED.points;

  -- lucasolivsantos -> 27 pts
  INSERT INTO public.predictions (user_id, pool_id, match_id, home_guess, away_guess, points)
  SELECT id, v_pool_id, v_match_id, 0, 0, 27 FROM public.profiles WHERE username = 'lucasolivsantos'
  ON CONFLICT (pool_id, user_id, match_id) DO UPDATE SET points = EXCLUDED.points;

END $$;
