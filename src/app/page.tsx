import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/Button';
import { HomeClient } from '@/components/home/HomeClient';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import type { Metadata } from 'next';
import logoImg from '../../public/logo.jpg';

export const metadata: Metadata = {
  title: 'Bolão dos Gentes Boas — Palpite com seus amigos',
};

/** Verifica a conexão com o Supabase sem autenticação */
async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('profiles').select('id').limit(0);

    // 42P01 é o erro direto do Postgres; PGRST204 (ou mensagem específica) é o do PostgREST
    if (
      error?.code === '42P01' || 
      error?.code === 'PGRST204' ||
      error?.message?.includes('Could not find the table')
    ) {
      return { ok: true, message: 'Supabase conectado ✓ (tabelas serão criadas no Card 1)' };
    }

    if (error) {
      return { ok: false, message: `Erro de conexão: ${error.message}` };
    }

    return { ok: true, message: 'Supabase conectado com sucesso ✓' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return { ok: false, message: `Falha ao conectar: ${message}` };
  }
}

export default async function HomePage() {
  const connection = await checkSupabaseConnection();

  return (
    <>
      <Header />

      <main id="main-content" className={styles.main}>
        {/* Hero */}
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={`container ${styles.heroContent}`}>

            <h1 id="hero-title" className={styles.heroTitle}>
              Bolão dos
              <span className={styles.heroHighlight}> Gentes Boas</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Aqui a disputa é com raça, e o título é sagrado.
            </p>

            <div style={{ marginTop: 'var(--space-8)', display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
              <Image 
                src={logoImg} 
                alt="Logo BolãoGB"
                width={600}
                height={400}
                priority
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
                }} 
              />
            </div>
          </div>

          {/* Decoração visual */}
          <div className={styles.heroDecor} aria-hidden="true">
            <div className={styles.heroOrb} />
          </div>
        </section>

        {/* Status de conexão — só visível em desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <section className={styles.statusSection} aria-label="Status do servidor">
            <div className="container">
              <div className={`${styles.statusCard} ${connection.ok ? styles.statusOk : styles.statusError}`}>
                <span className={styles.statusDot} aria-hidden="true" />
                <p className={styles.statusMessage}>{connection.message}</p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <p className={styles.footerText}>
            Bolão dos Gentes Boas — Copa 2026 · uso pessoal entre amigos
          </p>
        </div>
      </footer>

      {/* Modal + botão "?" — Client Component */}
      <HomeClient />
    </>
  );
}
