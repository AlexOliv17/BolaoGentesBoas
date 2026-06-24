const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
let cronSecret = '';
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && key.trim() === 'CRON_SECRET') {
    cronSecret = value.join('=').trim();
  }
});

async function run() {
  try {
    console.log('Triggering process-scores with CRON_SECRET:', cronSecret.substring(0, 4) + '...');
    const res = await fetch('http://localhost:3000/api/cron/process-scores', {
      headers: { 'Authorization': `Bearer ${cronSecret}` }
    });
    const data = await res.json();
    console.log('Response:', data);
  } catch (e) {
    console.error('Error:', e);
  }
}

run();
