'use client';

import { useState, useEffect } from 'react';
import { MatchCard } from '@/components/matches/MatchCard';
import styles from '@/components/matches/Match.module.css';
import poolStyles from '@/components/pools/Pools.module.css';

interface MatchesListProps {
  poolId: string;
}

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamCrest: string | null;
  awayTeamCrest: string | null;
  kickoffAt: string;
  status: 'scheduled' | 'live' | 'finished';
  homeScore: number | null;
  awayScore: number | null;
  matchday: number | null;
  groupName: string | null;
}

interface Prediction {
  match_id: number;
  home_guess: number;
  away_guess: number;
  points: number | null;
}

export function MatchesList({ poolId }: MatchesListProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isFirstLoad = true;

    async function fetchData() {
      if (isFirstLoad) {
        setLoading(true);
        isFirstLoad = false;
      }
      setError(null);

      try {
        // Busca jogos e palpites em paralelo
        const [matchesRes, predictionsRes] = await Promise.all([
          fetch('/api/matches'),
          fetch(`/api/predictions?poolId=${poolId}`),
        ]);

        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setMatches(matchesData.data || []);
        } else {
          setError('Erro ao carregar jogos');
        }

        if (predictionsRes.ok) {
          const predictionsData = await predictionsRes.json();
          setPredictions(predictionsData.data || []);
        }
      } catch {
        setError('Erro de conexão');
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Auto-refresh a cada 60s para atualizar placares ao vivo
    const interval = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(interval);
  }, [poolId]);

  if (loading) {
    return (
      <div className={poolStyles.emptyState}>
        <p>Carregando jogos do dia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={poolStyles.emptyState}>
        <p style={{ color: 'var(--color-error)' }}>{error}</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className={poolStyles.emptyState}>
        <p>Nenhum jogo da Copa hoje.</p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
          Os jogos aparecerão aqui automaticamente nos dias de partida.
        </p>
      </div>
    );
  }

  // Filtra jogos ao vivo para não duplicar com o LiveMatchesBanner
  const upcomingMatches = matches.filter(m => m.status !== 'live');

  if (upcomingMatches.length === 0) {
    return (
      <div className={poolStyles.emptyState}>
        <p>Nenhum jogo agendado para hoje.</p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
          Os jogos aparecerão aqui automaticamente.
        </p>
      </div>
    );
  }

  return (
    <ul className={styles.matchList}>
      {upcomingMatches.map((match) => {
        const prediction = predictions.find((p) => p.match_id === match.id) || null;

        return (
          <li key={match.id}>
            <MatchCard
              match={match}
              poolId={poolId}
              existingPrediction={prediction}
            />
          </li>
        );
      })}
    </ul>
  );
}
