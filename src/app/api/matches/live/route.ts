import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('poolId');
    
    if (!poolId) {
      return NextResponse.json({ error: 'Missing poolId' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nowUtc = new Date().toISOString();
    
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`status.eq.live,and(status.eq.scheduled,kickoff_at.lte.${nowUtc})`);

    if (!matches || matches.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const mappedMatches = matches.map(row => ({
      id: row.id,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      homeTeamCrest: row.home_team_crest || null,
      awayTeamCrest: row.away_team_crest || null,
      kickoffAt: row.kickoff_at,
      status: row.status === 'scheduled' && new Date(row.kickoff_at).getTime() <= Date.now() ? 'live' : row.status as 'scheduled' | 'live' | 'finished',
      homeScore: row.home_score,
      awayScore: row.away_score,
      matchday: row.matchday || null,
      groupName: row.group_name || null,
    }));

    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('pool_id', poolId)
      .eq('user_id', user.id)
      .in('match_id', matches.map(m => m.id));

    const finalData = mappedMatches.map(match => ({
      match,
      prediction: predictions?.find(p => p.match_id === match.id) || null
    }));

    return NextResponse.json({ data: finalData });
  } catch (error) {
    console.error('[GET /api/matches/live] Erro:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
