import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FriendsTabs } from '@/components/friends/FriendsTabs';
import { Metadata } from 'next';
import Link from 'next/link';
import headerStyles from '@/components/shared/Header.module.css';
import styles from '@/components/friends/Friends.module.css';

export const metadata: Metadata = {
  title: 'Amigos | BolãoGB',
  description: 'Gerencie seus amigos no BolãoGB',
};

export default async function FriendsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Busca todas as relações de amizade do usuário
  const { data: friendships, error: friendsError } = await supabase
    .from('friendships')
    .select(`
      id,
      status,
      created_at,
      requester:requester_id (id, username, nickname, avatar_url),
      addressee:addressee_id (id, username, nickname, avatar_url)
    `)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (friendsError) {
    console.error('Erro ao buscar amizades:', friendsError);
  }

  const allFriendships = friendships || [];

  const friends = allFriendships.filter(f => f.status === 'accepted');
  const pendingReceived = allFriendships.filter(f => f.status === 'pending' && f.addressee.id === user.id);
  const pendingSent = allFriendships.filter(f => f.status === 'pending' && f.requester.id === user.id);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-12)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <nav className={styles.navBar}>
          <Link href="/dashboard" className={styles.backButton}>
            <span aria-hidden="true">←</span> Voltar
          </Link>
        </nav>
      </div>

      <div style={{ marginBottom: 'var(--space-8)', alignSelf: 'center' }}>
        <Link href="/dashboard" className={headerStyles.logo} aria-label="Voltar para o Dashboard">
          <div className={headerStyles.logoIconWrapper}>
            <span className={headerStyles.logoIcon} aria-hidden="true">⚽</span>
          </div>
          <span className={headerStyles.logoText}>
            <span className={headerStyles.logoTextTop}>Copa</span>
            <span className={headerStyles.logoTextBottom}>Gentes Boas</span>
          </span>
        </Link>
      </div>

      <header style={{ marginBottom: 'var(--space-6)', textAlign: 'center', width: '100%', maxWidth: '600px' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-heading)', color: 'var(--color-interactive)' }}>
          Amigos
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Gerencie suas amizades e adicione novos participantes.</p>
      </header>

      <FriendsTabs 
        currentUserId={user.id}
        friends={friends}
        pendingReceived={pendingReceived}
        pendingSent={pendingSent}
      />
    </div>
  );
}
