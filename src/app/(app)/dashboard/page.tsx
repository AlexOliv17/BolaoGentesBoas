import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import styles from '@/components/pools/Pools.module.css';
import { LogoutButton } from './LogoutButton';
import { NotificationsBell } from '@/components/layout/NotificationsBell';

import { RulesModal } from '@/components/layout/RulesModal';

export const metadata: Metadata = {
  title: 'Dashboard | BolãoGB',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getMyPools(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('pool_members')
    .select(`
      role,
      pools (
        id,
        name,
        description,
        pool_members (count)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getMyPools] Error fetching pools:', error);
    return [];
  }

  if (!data) return [];

  return data.map((membership: any) => ({
    id: membership.pools.id,
    name: membership.pools.name,
    description: membership.pools.description,
    my_role: membership.role,
    member_count: membership.pools.pool_members[0].count
  }));
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('profiles')
    .select('nickname, first_login')
    .eq('id', user.id)
    .single();
    
  const profileData = data as { nickname: string, first_login: boolean } | null;

  const pools = await getMyPools(user.id);

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
            Olá, {profileData?.nickname || 'Torcedor'}! ⚽
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <RulesModal autoOpen={profileData?.first_login} />
          <NotificationsBell />
          <Link href="/profile" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm">Perfil</Button>
          </Link>
          <Link href="/friends" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm">Amigos</Button>
          </Link>
          <LogoutButton size="sm" />
        </div>
      </div>

      <div className={styles.header} style={{ marginTop: 'var(--space-4)' }}>
        <h2 className={styles.title} style={{ fontSize: 'var(--font-size-xl)' }}>Meus Bolões</h2>
        <Link href="/pools/new">
          <Button size="sm">Novo Bolão</Button>
        </Link>
      </div>

      {pools.length === 0 ? (
        <div className={styles.emptyState}>
          <p style={{ marginBottom: 'var(--space-4)' }}>Você ainda não participa de nenhum bolão.</p>
          <Link href="/pools/new">
            <Button>Criar meu primeiro bolão</Button>
          </Link>
        </div>
      ) : (
        <ul className={styles.poolList}>
          {pools.map((pool) => (
            <li key={pool.id}>
              <Link href={`/pools/${pool.id}`} className={styles.poolCard}>
                <div className={styles.poolHeader}>
                  <h2 className={styles.poolName}>{pool.name}</h2>
                </div>
                {pool.description && (
                  <p className={styles.poolDescription}>{pool.description}</p>
                )}
                <div className={styles.poolFooter}>
                  <div className={styles.memberCount}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    {pool.member_count} membro{pool.member_count !== 1 ? 's' : ''}
                  </div>
                  <span className={`${styles.roleBadge} ${pool.my_role === 'admin' ? styles.roleAdmin : styles.roleMember}`}>
                    {pool.my_role === 'admin' ? 'Dono' : 'Membro'}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
