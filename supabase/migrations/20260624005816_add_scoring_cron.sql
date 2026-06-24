-- Habilita as extensões necessárias para agendamento (pg_cron) e requisições HTTP (pg_net)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- O pg_cron chama nossa rota via pg_net a cada 5 minutos
-- NOTA: Você precisa alterar 'SUA_URL_AQUI' e 'SEU_CRON_SECRET' para os valores reais em produção.
-- Exemplo URL: https://bolao-gb.vercel.app/api/cron/process-scores
SELECT cron.schedule(
  'process_scores_job',
  '*/5 * * * *', -- A cada 5 minutos
  $$
    SELECT net.http_get(
      url:='SUA_URL_AQUI',
      headers:='{"Authorization": "Bearer SEU_CRON_SECRET_AQUI"}'::jsonb
    );
  $$
);

-- Para remover o job futuramente caso precise, use:
-- SELECT cron.unschedule('process_scores_job');
