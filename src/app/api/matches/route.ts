/**
 * GET /api/matches
 *
 * Retorna os jogos da Copa para o front-end.
 * Por padrão retorna os jogos do dia atual.
 *
 * Query params opcionais:
 * - date: YYYY-MM-DD (data específica)
 * - status: scheduled | live | finished (filtro de status)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { footballDataSource } from '@/lib/football';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isHistory = searchParams.get('history') === 'true';
    const statusFilter = searchParams.get('status');

    // 2. Buscar jogos (com cache inteligente)
    let matches = isHistory 
      ? await footballDataSource.getHistoricalMatches()
      : await footballDataSource.getTodaysMatches();

    if (isHistory) {
      matches = matches.filter(m => m.status === 'finished' || m.status === 'live');
    }

    // 3. Filtrar por status, se informado
    const filteredMatches = statusFilter
      ? matches.filter((m) => m.status === statusFilter)
      : matches;

    return NextResponse.json({ data: filteredMatches });
  } catch (error) {
    console.error('[GET /api/matches] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar jogos' },
      { status: 500 }
    );
  }
}
