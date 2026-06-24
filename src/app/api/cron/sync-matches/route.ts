/**
 * POST /api/cron/sync-matches
 *
 * Rota de sincronização dos jogos da Copa com a API football-data.org.
 * Protegida por CRON_SECRET — pensada para ser chamada pelo pg_cron do Supabase.
 *
 * Comportamento:
 * 1. Importa/atualiza os jogos do dia atual
 * 2. Atualiza jogos com status 'live' (em andamento)
 * 3. Retorna quantos jogos foram sincronizados
 */

import { NextRequest, NextResponse } from 'next/server';
import { footballDataSource } from '@/lib/football';
import { getTodayDateString } from '@/utils/date';

export async function POST(request: NextRequest) {
  // 1. Validar CRON_SECRET
  const secret = request.headers.get('x-cron-secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const today = getTodayDateString();

    console.log(`[sync-matches] Sincronizando jogos do dia: ${today}`);

    // 2. Sincronizar jogos do dia
    const count = await footballDataSource.syncMatches(today, today);

    console.log(`[sync-matches] ${count} jogos sincronizados com sucesso.`);

    return NextResponse.json({
      message: `${count} jogo(s) sincronizado(s)`,
      date: today,
      count,
    });
  } catch (error) {
    console.error('[sync-matches] Erro na sincronização:', error);
    return NextResponse.json(
      { error: 'Erro na sincronização dos jogos' },
      { status: 500 }
    );
  }
}
