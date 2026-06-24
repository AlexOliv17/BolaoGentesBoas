-- Adiciona política para permitir que o dono do bolão possa deletá-lo
CREATE POLICY "Pools can be deleted by owner" 
  ON public.pools FOR DELETE 
  USING (auth.uid() = owner_id);
