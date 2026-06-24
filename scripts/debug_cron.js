const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.join('=').trim();
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // O Supabase JS client usa a API PostgREST, que não expõe as tabelas do schema cron ou net por padrão.
  // Vamos tentar chamar uma query SQL diretamente (se permitido) ou fazer uma chamada para nossa própria API local
  // Na verdade, a melhor forma é bater no endpoint local com o cron_secret para ver o log de erro real do Next.js
  try {
    const res = await fetch('http://localhost:3000/api/cron/process-scores', {
      headers: { 'Authorization': `Bearer a7eb8d70f47133b8502773d34f120921ba67ce53d1f92e9af29ed8359e87e073` }
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (e) {
    console.error('Fetch error:', e);
  }
}

run();
