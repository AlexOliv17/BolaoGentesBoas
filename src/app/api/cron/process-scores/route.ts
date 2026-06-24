import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculatePoints } from '@/utils/scoring';
import { footballDataSource } from '@/lib/football';
import type { Database } from '@/types/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  // 1. Validação de Segurança (CRON_SECRET)
  // O header de Authorization envia "Bearer <CRON_SECRET>"
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Cliente admin para bypassar RLS
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient<any>(supabaseUrl, supabaseKey);

  try {
    // 2. Sincronizar jogos recentes da API externa
    // Puxamos de ontem até amanhã para cobrir fusos horários
    const today = new Date();
    
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(today.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
    
    const tomorrowDate = new Date(today);
    tomorrowDate.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

    console.log('[cron] Sincronizando partidas da API externa...');
    await footballDataSource.syncMatches(yesterdayStr, tomorrowStr);

    // 3. Buscar os jogos finalizados (status = 'finished')
    const { data: finishedMatches, error: matchesErr } = await supabase
      .from('matches')
      .select('id, home_score, away_score, status')
      .eq('status', 'finished');

    if (matchesErr) throw matchesErr;
    if (!finishedMatches || finishedMatches.length === 0) {
      return NextResponse.json({ message: 'Nenhum jogo finalizado encontrado.' });
    }

    const finishedMatchIds = finishedMatches.map(m => m.id);

    // 4. Buscar palpites pendentes (points IS NULL) para esses jogos
    const { data: pendingPredictions, error: predErr } = await supabase
      .from('predictions')
      .select('id, home_guess, away_guess, match_id')
      .in('match_id', finishedMatchIds)
      .is('points', null);

    if (predErr) throw predErr;
    if (!pendingPredictions || pendingPredictions.length === 0) {
      return NextResponse.json({ message: 'Todos os palpites já estão pontuados.' });
    }

    console.log(`[cron] Processando ${pendingPredictions.length} palpites pendentes...`);

    // 5. Calcular pontos e atualizar no banco
    let processedCount = 0;

    // Em vez de bulk update complexo, fazemos chamadas individuais (aceitável para centenas de palpites)
    // Se a escala crescer para 10.000+, usar uma RPC (Stored Procedure)
    const updatePromises = pendingPredictions.map(async (prediction) => {
      const match = finishedMatches.find(m => m.id === prediction.match_id);
      
      if (!match || match.home_score === null || match.away_score === null) return;

      const points = calculatePoints(
        match.home_score,
        match.away_score,
        prediction.home_guess,
        prediction.away_guess
      );

      const { error: updateErr } = await supabase
        .from('predictions')
        .update({ points })
        .eq('id', prediction.id);

      if (!updateErr) processedCount++;
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'Pontuação processada com sucesso.',
      processedPredictions: processedCount,
    });
  } catch (error: any) {
    console.error('[cron] Erro ao processar pontos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
