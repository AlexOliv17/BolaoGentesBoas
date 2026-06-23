import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogoutButton } from './LogoutButton';

import type { Database } from '@/types/database';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = profileData as Database['public']['Tables']['profiles']['Row'] | null;

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
      <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-4)' }}>
        Olá, {profile?.nickname || 'Torcedor'}! ⚽
      </h1>

      <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <p style={{ marginBottom: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
          Autenticação realizada com sucesso. Em breve seus bolões aparecerão aqui.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <Link href="/profile" style={{ 
            padding: 'var(--space-2) var(--space-4)', 
            backgroundColor: 'var(--color-surface-hover)', 
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            color: 'var(--color-text)'
          }}>
            Meu Perfil
          </Link>
          <Link href="/friends" style={{ 
            padding: 'var(--space-2) var(--space-4)', 
            backgroundColor: 'var(--color-surface-hover)', 
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            color: 'var(--color-text)'
          }}>
            Meus Amigos
          </Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
