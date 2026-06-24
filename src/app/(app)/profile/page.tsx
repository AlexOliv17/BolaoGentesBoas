import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { ProfileForm } from '@/components/profile/ProfileForm';
import styles from '@/components/profile/Profile.module.css';

export const metadata = {
  title: 'Meu Perfil | BolãoGB',
  description: 'Gerencie seu perfil e avatar no BolãoGB',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, nickname, avatar_url')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    // Falha ao carregar perfil
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Erro</h1>
          <p className={styles.subtitle}>Não foi possível carregar seu perfil.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backButton}>
        ← Voltar ao Dashboard
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>Meu Perfil</h1>
        <p className={styles.subtitle}>@{profile.username}</p>
      </header>

      <AvatarUpload 
        userId={profile.id}
        currentAvatarUrl={profile.avatar_url}
        nickname={profile.nickname}
      />

      <ProfileForm initialNickname={profile.nickname} />
    </div>
  );
}
