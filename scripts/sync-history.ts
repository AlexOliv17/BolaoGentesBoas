import { footballDataSource } from '../src/lib/football';
import { getTodayDateString } from '../src/utils/date';

// Load env variables


async function run() {
  console.log('Iniciando sincronização do histórico...');
  try {
    const today = getTodayDateString();
    const startDate = '2026-06-11';
    
    const count = await footballDataSource.syncMatches(startDate, today);
    console.log(`Sucesso! Sincronizados ${count} jogos.`);
  } catch (err) {
    console.error('Erro na sincronização:', err);
  }
}

run();
