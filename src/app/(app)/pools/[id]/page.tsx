import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import styles from '@/components/pools/Pools.module.css';
import { PoolTabs } from '@/components/pools/PoolTabs';
import { DeletePoolButton } from '@/components/pools/DeletePoolButton';
import { InviteFriendsButton } from '@/components/pools/InviteFriendsButton';
import { MatchCard } from '@/components/matches/MatchCard';
import matchesStyles from '@/components/matches/Match.module.css';

export const metadata: Metadata = {
  title: 'Bolão',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getPoolDetails(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: memberData, error: memberError } = await supabase
    .from('pool_members')
    .select('role')
    .eq('pool_id', id)
    .eq('user_id', user.id)
    .single();

  if (memberError) {
    console.error('[getPoolDetails] memberError:', memberError);
  }

  if (!memberData) return null;

  const { data: poolData, error: poolError } = await supabase
    .from('pools')
    .select('*')
    .eq('id', id)
    .single();

  if (poolError) {
    console.error('[getPoolDetails] poolError:', poolError);
  }

  if (!poolData) return null;

  const { data: membersData } = await supabase
    .from('pool_members')
    .select(`
      id,
      user_id,
      role,
      created_at,
      profile:profiles!user_id(id, username, nickname, avatar_url)
    `)
    .eq('pool_id', id)
    .order('role', { ascending: true }) 
    .order('created_at', { ascending: true });

  return {
    pool: { ...(poolData as any), my_role: memberData.role },
    members: membersData || []
  };
}

async function getLiveMatches(poolId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  
  // Buscar jogos ao vivo ou que já passaram do horário mas ainda não finalizaram (fallback)
  const nowUtc = new Date().toISOString();
  
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .or(`status.eq.live,and(status.eq.scheduled,kickoff_at.lte.${nowUtc})`);

  if (!matches || matches.length === 0) return [];

  // Mapear para o formato que o MatchCard espera
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
    .eq('user_id', userId)
    .in('match_id', matches.map(m => m.id));

  return mappedMatches.map(match => ({
    match,
    prediction: predictions?.find(p => p.match_id === match.id) || null
  }));
}

export default async function PoolDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getPoolDetails(resolvedParams.id);

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.poolCard} style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
          <h2>Bolão não encontrado 😢</h2>
          <p>O bolão que você tentou acessar não existe ou você não tem permissão para vê-lo.</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>ID Procurado: {resolvedParams.id}</p>
          <Link href="/dashboard" style={{ marginTop: 'var(--space-4)', display: 'inline-block' }}>
            <Button>Voltar ao Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Precisamos do ID do usuário logado para carregar as predições dos jogos ao vivo
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const liveMatches = user ? await getLiveMatches(data.pool.id, user.id) : [];

  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backButton}>
        ← Voltar ao Dashboard
      </Link>
      
      <div className={styles.header} style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
          <h1 className={styles.title}>{data.pool.name}</h1>
          {data.pool.description && (
            <p className={styles.subtitle}>{data.pool.description}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <InviteFriendsButton poolId={data.pool.id} />
          {data.pool.my_role === 'admin' && (
            <DeletePoolButton poolId={data.pool.id} poolName={data.pool.name} />
          )}
        </div>
      </div>

      {liveMatches.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ 
            fontSize: 'var(--text-lg)', 
            color: 'var(--color-danger)', 
            marginBottom: 'var(--space-4)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <span style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-danger)',
              boxShadow: '0 0 10px var(--color-danger)',
              animation: 'pulse 1.5s infinite'
            }}></span>
            Ao Vivo Agora
          </h2>
          <ul className={matchesStyles.matchList}>
            {liveMatches.map(({ match, prediction }) => (
              <li key={match.id}>
                <MatchCard 
                  match={match} 
                  poolId={data.pool.id} 
                  existingPrediction={prediction} 
                  readOnly={true} 
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <PoolTabs pool={data.pool} members={data.members} />
    </div>
  );
}
