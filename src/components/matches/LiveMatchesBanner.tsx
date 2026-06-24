'use client';

import { useState, useEffect } from 'react';
import { MatchCard } from '@/components/matches/MatchCard';
import matchesStyles from '@/components/matches/Match.module.css';

interface LiveMatchesBannerProps {
  poolId: string;
}

export function LiveMatchesBanner({ poolId }: LiveMatchesBannerProps) {
  const [liveMatches, setLiveMatches] = useState<any[]>([]);

  useEffect(() => {
    async function fetchLive() {
      try {
        // Aproveitando a rota existente e forçando a busca dos jogos de "hoje"
        // Como o cache agora avalia globalmente, ele fará o sync se necessário
        const res = await fetch('/api/matches');
        if (!res.ok) return;
        const data = await res.json();
        
        // A API retorna os jogos de hoje. Mas precisamos garantir que busque todos os lives globais
        // Para simplificar e não refatorar a API inteira agora, chamaremos um endpoint novo
        const liveRes = await fetch(`/api/matches/live?poolId=${poolId}`);
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          setLiveMatches(liveData.data || []);
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetchLive();
    const interval = setInterval(fetchLive, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, [poolId]);

  if (liveMatches.length === 0) return null;

  return (
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
              poolId={poolId} 
              existingPrediction={prediction} 
              readOnly={true} 
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
