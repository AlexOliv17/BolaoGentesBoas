-- 1. Habilitar extensões necessárias
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 2. Limpar agendamentos anteriores (caso existam)
-- select cron.unschedule('process-scores');
-- select cron.unschedule('send-reminders');

-- 3. Criar agendamento para processar pontos a cada 5 minutos
select cron.schedule(
  'process-scores', -- Nome do job
  '*/5 * * * *',    -- Expressão Cron: a cada 5 minutos
  $$
    select net.http_get(
      url:='https://bolao-gentes-boas.vercel.app/api/cron/process-scores',
      headers:='{"Authorization": "Bearer a7eb8d70f47133b8502773d34f120921ba67ce53d1f92e9af29ed8359e87e073"}'::jsonb
    );
  $$
);

-- 4. Criar agendamento para disparar e-mails de lembrete a cada 10 minutos
select cron.schedule(
  'send-reminders', -- Nome do job
  '*/10 * * * *',   -- Expressão Cron: a cada 10 minutos
  $$
    select net.http_get(
      url:='https://bolao-gentes-boas.vercel.app/api/cron/reminders',
      headers:='{"Authorization": "Bearer a7eb8d70f47133b8502773d34f120921ba67ce53d1f92e9af29ed8359e87e073"}'::jsonb
    );
  $$
);
