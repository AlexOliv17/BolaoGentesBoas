-- Configuração do Agendamento (pg_cron + pg_net) para Lembretes de Palpite
-- ATENÇÃO: Substitua 'YOUR_SITE_URL' e 'YOUR_CRON_SECRET' pelos valores reais do seu projeto de produção.

-- Descomente as linhas abaixo e execute diretamente no painel SQL do Supabase quando o sistema for para o ar:

/*
-- Ativa as extensões necessárias (geralmente já ativas na Vercel/Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendamento para rodar a cada 1 minuto
SELECT cron.schedule(
  'email-reminders-job',
  '* * * * *',
  $$
    SELECT net.http_get(
        url:='https://YOUR_SITE_URL/api/cron/reminders',
        headers:='{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
    )
  $$
);
*/
