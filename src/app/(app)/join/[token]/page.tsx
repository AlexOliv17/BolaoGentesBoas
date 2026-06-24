'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import styles from '@/components/pools/Pools.module.css';

export default function JoinPoolPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedParams = use(params);

  const handleJoin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/pools/join/${resolvedParams.token}`, {
        method: 'POST',
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        setError(json.error || 'Erro ao entrar no bolão');
        return;
      }
      
      router.push(`/pools/${json.data.pool_id}`);
      router.refresh();
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh', margin: '0 auto' }}>
      <div className={styles.poolCard} style={{ width: '100%', maxWidth: '400px', textAlign: 'center', cursor: 'default', padding: 'var(--space-6)' }}>
        <h1 className={styles.title} style={{ marginBottom: 'var(--space-4)' }}>Convite Especial 🏆</h1>
        <p style={{ marginBottom: 'var(--space-6)', color: 'var(--color-text-muted)' }}>
          Você foi convidado para participar de um bolão! Clique no botão abaixo para aceitar o desafio e entrar no jogo.
        </p>
        
        {error && (
          <div style={{ color: 'var(--color-error)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
            {error}
          </div>
        )}
        
        <Button 
          onClick={handleJoin} 
          isLoading={loading} 
          style={{ width: '100%', marginBottom: 'var(--space-2)' }}
        >
          Aceitar Convite e Entrar
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={() => router.push('/dashboard')} 
          style={{ width: '100%' }}
        >
          Agora Não
        </Button>
      </div>
    </div>
  );
}
