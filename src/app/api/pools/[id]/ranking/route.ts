import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: poolId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    // 1. Busca todos os membros do bolão
    const { data: members, error: membersErr } = await supabase
      .from('pool_members')
      .select(`
        user_id,
        profile:profiles!user_id(nickname, username, avatar_url)
      `)
      .eq('pool_id', poolId);

    if (membersErr) throw membersErr;

    // 2. Busca todos os palpites pontuados deste bolão
    const { data: predictions, error: predsErr } = await supabase
      .from('predictions')
      .select('user_id, points')
      .eq('pool_id', poolId)
      .not('points', 'is', null);

    if (predsErr) throw predsErr;

    // 3. Agrega os pontos
    const stats: Record<string, { totalPoints: number; exactScores: number; correctResults: number }> = {};
    
    members.forEach(m => {
      stats[m.user_id] = { totalPoints: 0, exactScores: 0, correctResults: 0 };
    });

    predictions.forEach(p => {
      if (!stats[p.user_id]) return; // Fallback
      
      stats[p.user_id].totalPoints += p.points || 0;
      
      if (p.points === 8) {
        stats[p.user_id].exactScores += 1;
      } else if (p.points === 5) {
        stats[p.user_id].correctResults += 1;
      }
    });

    // 4. Monta array final e ordena
    const ranking = members.map(m => {
      const userStats = stats[m.user_id];
      const profile = m.profile as unknown as { nickname: string; username: string; avatar_url: string | null };
      return {
        user_id: m.user_id,
        nickname: profile.nickname,
        username: profile.username,
        avatar_url: profile.avatar_url,
        totalPoints: userStats.totalPoints,
        exactScores: userStats.exactScores,
        correctResults: userStats.correctResults,
      };
    });

    // Ordenação: Pontos DESC, ExactScores DESC, Nome ASC
    ranking.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
      return a.nickname.localeCompare(b.nickname);
    });

    // Calcula as posições compartilhadas em caso de empate (pontos e placar exato)
    let currentPosition = 1;
    const rankingWithPositions = ranking.map((user, index) => {
      if (index > 0) {
        const prev = ranking[index - 1];
        if (prev.totalPoints !== user.totalPoints || prev.exactScores !== user.exactScores) {
          currentPosition = index + 1;
        }
      }
      return { ...user, position: currentPosition };
    });

    return NextResponse.json({ data: rankingWithPositions });
  } catch (error: any) {
    console.error('[GET /api/pools/:id/ranking] Erro:', error);
    return NextResponse.json({ error: 'Falha ao carregar ranking' }, { status: 500 });
  }
}
