const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.join('=').trim().replace(/"/g, '');
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('pool_members')
    .select(`
      user_id,
      role,
      created_at,
      profile:profiles!user_id (
        id,
        avatar_url,
        nickname,
        username
      )
    `)
    .eq('pool_id', 'b754b310-01d0-4bd2-974a-10f848981f21'); // ID from user's screenshot

  console.log('Error:', error);
  console.log('Data:', data?.length);
}

run();
