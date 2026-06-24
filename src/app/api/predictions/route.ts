/**
 * POST /api/predictions
 *
 * Salva ou atualiza o palpite de um usuário para um jogo dentro de um bolão.
 *
 * Regras:
 * - Usuário deve estar autenticado e ser membro do bolão
 * - Palpite só permitido enquanto agora < kickoff_at - 1 minuto (validado no servidor)
 * - Um palpite por jogo/usuário/bolão (upsert)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { predictionSchema } from '@/lib/validators/prediction';
import { handleApiError } from '@/lib/errors';
import { isPredictionEditable } from '@/utils/date';

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Validação de entrada com Zod
    const body = await request.json();
    const parsed = predictionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const { poolId, matchId, homeGuess, awayGuess, penaltyWinnerGuess } = parsed.data;

    // 3. Verificar se é membro do bolão
    const { data: memberData, error: memberError } = await supabase
      .from('pool_members')
      .select('id')
      .eq('pool_id', poolId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json({ error: 'Você não é membro deste bolão' }, { status: 403 });
    }

    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('kickoff_at, status, stage')
      .eq('id', matchId)
      .single();

    if (matchError || !matchData) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }

    const isKnockout = matchData.stage !== 'GROUP_STAGE';
    const isDraw = homeGuess === awayGuess;

    if (isKnockout && isDraw && !penaltyWinnerGuess) {
      return NextResponse.json({ error: 'É obrigatório selecionar o vencedor dos pênaltis em jogos de mata-mata que terminam empatados.' }, { status: 400 });
    }

    if (!isPredictionEditable(matchData.kickoff_at)) {
      return NextResponse.json(
        { error: 'Prazo de palpite encerrado para este jogo' },
        { status: 422 }
      );
    }

    // 5. Upsert do palpite (INSERT ON CONFLICT UPDATE)
    const { data: prediction, error: upsertError } = await supabase
      .from('predictions')
        {
          pool_id: poolId,
          user_id: user.id,
          match_id: matchId,
          home_guess: homeGuess,
          away_guess: awayGuess,
          penalty_winner_guess: (isKnockout && isDraw) ? penaltyWinnerGuess : null,
        },
        { onConflict: 'pool_id,user_id,match_id' }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('[POST /api/predictions] Upsert error:', upsertError);
      return NextResponse.json({ error: 'Erro ao salvar palpite' }, { status: 400 });
    }

    return NextResponse.json({ data: prediction }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/predictions?poolId=xxx
 *
 * Retorna todos os palpites do usuário logado para um bolão específico.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('poolId');

    if (!poolId) {
      return NextResponse.json({ error: 'poolId é obrigatório' }, { status: 422 });
    }

    const { data: predictions, error } = await supabase
      .from('predictions')
      .select('match_id, home_guess, away_guess, points')
      .eq('pool_id', poolId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[GET /api/predictions] Error:', error);
      return NextResponse.json({ error: 'Erro ao buscar palpites' }, { status: 400 });
    }

    return NextResponse.json({ data: predictions || [] });
  } catch (error) {
    return handleApiError(error);
  }
}
