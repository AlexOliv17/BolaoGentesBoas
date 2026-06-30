'use client';

import { useState, useEffect, useMemo } from 'react';
import { MatchCard } from '@/components/matches/MatchCard';
import { MemberSelectModal } from '@/components/pools/MemberSelectModal';
import { Button } from '@/components/ui/Button';
import styles from '@/components/matches/Match.module.css';
import poolStyles from '@/components/pools/Pools.module.css';

interface HistoryListProps {
  poolId: string;
  members?: any[];
  currentUserId?: string;
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
  stage?: string;
  penaltyWinner?: 'home' | 'away' | null;
}

interface Prediction {
  match_id: number;
  home_guess: number;
  away_guess: number;
  penalty_winner_guess: 'home' | 'away' | null;
  points: number | null;
}

export function HistoryList({ poolId, members = [], currentUserId = '' }: HistoryListProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentUserId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [matchesRes, predictionsRes] = await Promise.all([
          fetch('/api/matches?history=true'),
          fetch(`/api/predictions?poolId=${poolId}&userId=${selectedMemberId}`),
        ]);

        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          setMatches(matchesData.data || []);
        } else {
          setError('Erro ao carregar histórico');
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
  }, [poolId, selectedMemberId]);

  const [activeDateIndex, setActiveDateIndex] = useState<number>(0);

  // Agrupa os jogos por data (chave = YYYY-MM-DD no fuso de SP)
  const matchesByDate = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    
    matches.forEach(match => {
      // Converte para fuso de SP para agrupamento correto
      const date = new Date(match.kickoffAt);
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const dateStr = formatter.format(date); // Retorna "YYYY-MM-DD" no fuso local
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(match);
    });

    return grouped;
  }, [matches]);

  const dateKeys = useMemo(() => {
    return Object.keys(matchesByDate).sort(); // ascendente: do dia 1 ao atual
  }, [matchesByDate]);

  // Por padrão, ir para o último dia disponível (mais recente)
  useEffect(() => {
    if (dateKeys.length > 0) {
      setActiveDateIndex(dateKeys.length - 1);
    }
  }, [dateKeys.length]);

  if (loading) {
    return (
      <div className={poolStyles.emptyState}>
        <p>Carregando histórico...</p>
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

  if (matches.length === 0 || dateKeys.length === 0) {
    return (
      <div className={poolStyles.emptyState}>
        <p>Nenhum jogo anterior encontrado.</p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
          Assim que a Copa começar, você verá os jogos passados aqui.
        </p>
      </div>
    );
  }

  const activeDateKey = dateKeys[activeDateIndex];
  const activeMatches = matchesByDate[activeDateKey];

  // Formatar a data para exibição
  const displayDate = new Date(`${activeDateKey}T12:00:00Z`).toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: '2-digit', 
    month: '2-digit' 
  }).toUpperCase();

  const selectedMember = members.find(m => m.user_id === selectedMemberId);
  const selectedMemberName = selectedMember?.profile?.nickname || 'Membro';
  const selectedMemberAvatar = selectedMember?.profile?.avatar_url;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Navegação de Datas */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: 'var(--space-2)'
      }}>
        <button 
          onClick={() => setActiveDateIndex(i => Math.max(0, i - 1))}
          disabled={activeDateIndex === 0}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeDateIndex === 0 ? 'var(--color-text-disabled)' : 'var(--color-interactive)',
            cursor: activeDateIndex === 0 ? 'not-allowed' : 'pointer',
            fontSize: 'var(--text-xl)',
            padding: 'var(--space-2)'
          }}
          aria-label="Dia anterior"
        >
          &lt;
        </button>

        <h3 style={{ 
          fontSize: 'var(--text-lg)', 
          color: 'var(--color-brand-gold)',
          margin: 0,
          textAlign: 'center'
        }}>
          {displayDate}
        </h3>

        <button 
          onClick={() => setActiveDateIndex(i => Math.min(dateKeys.length - 1, i + 1))}
          disabled={activeDateIndex === dateKeys.length - 1}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeDateIndex === dateKeys.length - 1 ? 'var(--color-text-disabled)' : 'var(--color-interactive)',
            cursor: activeDateIndex === dateKeys.length - 1 ? 'not-allowed' : 'pointer',
            fontSize: 'var(--text-xl)',
            padding: 'var(--space-2)'
          }}
          aria-label="Dia seguinte"
        >
          &gt;
        </button>
      </div>

      {/* Seleção de Membros (Entre a data e os jogos) */}
      {members.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)' }}>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '0 var(--space-3)', fontSize: 'var(--text-xs)', height: '28px' }}
          >
            Filtrar Membro
          </Button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div style={{ 
              width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--color-bg)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              border: '1px solid var(--color-brand-gold)'
            }}>
              {selectedMemberAvatar ? (
                <img src={selectedMemberAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontWeight: 'bold', fontSize: 'var(--text-xs)', color: 'var(--color-text)' }}>
                  {selectedMemberName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-brand-gold)' }}>
              {selectedMemberName}
            </span>
          </div>
        </div>
      )}

      {/* Lista de Jogos do Dia */}
      <ul className={styles.matchList}>
        {activeMatches.map((match) => {
          const prediction = predictions.find((p) => p.match_id === match.id) || null;

          return (
            <li key={match.id}>
              <MatchCard
                match={match}
                poolId={poolId}
                existingPrediction={prediction}
                readOnly={true}
                predictionOwnerName={selectedMemberId !== currentUserId ? selectedMemberName : undefined}
              />
            </li>
          );
        })}
      </ul>

      {isModalOpen && (
        <MemberSelectModal
          members={members}
          currentUserId={currentUserId}
          onSelect={setSelectedMemberId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
