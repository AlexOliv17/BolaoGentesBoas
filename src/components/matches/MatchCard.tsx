'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './Match.module.css';
import { toDisplayTime, formatCountdown, isPredictionEditable } from '@/utils/date';

interface MatchCardProps {
  match: {
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
  };
  poolId: string;
  existingPrediction?: {
    home_guess: number;
    away_guess: number;
    penalty_winner_guess?: 'home' | 'away' | null;
    points: number | null;
  } | null;
  readOnly?: boolean;
}

type FeedbackState = 'idle' | 'saving' | 'saved' | 'error' | 'locked';

export function MatchCard({ match, poolId, existingPrediction, readOnly = false }: MatchCardProps) {
  const [homeGuess, setHomeGuess] = useState<string>(
    existingPrediction?.home_guess?.toString() ?? ''
  );
  const [awayGuess, setAwayGuess] = useState<string>(
    existingPrediction?.away_guess?.toString() ?? ''
  );
  const [penaltyWinnerGuess, setPenaltyWinnerGuess] = useState<'home' | 'away' | null>(
    existingPrediction?.penalty_winner_guess ?? null
  );
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [feedbackText, setFeedbackText] = useState('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editable = !readOnly && match.status === 'scheduled' && isPredictionEditable(match.kickoffAt);

  // Auto-save com debounce
  const savePrediction = useCallback(async (home: string, away: string, penWinner: 'home' | 'away' | null) => {
    const homeNum = parseInt(home, 10);
    const awayNum = parseInt(away, 10);

    if (isNaN(homeNum) || isNaN(awayNum) || homeNum < 0 || awayNum < 0) return;

    const isKnockout = match.stage && match.stage !== 'GROUP_STAGE';
    const isDraw = homeNum === awayNum;

    if (isKnockout && isDraw && !penWinner) {
      // Esperando o usuário escolher o vencedor dos pênaltis
      setFeedback('idle');
      return;
    }

    setFeedback('saving');
    setFeedbackText('Salvando...');

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId,
          matchId: match.id,
          homeGuess: homeNum,
          awayGuess: awayNum,
          penaltyWinnerGuess: penWinner,
        }),
      });

      if (res.ok) {
        setFeedback('saved');
        setFeedbackText('Palpite salvo!');
        setTimeout(() => {
          setFeedback('idle');
          setFeedbackText('');
        }, 2000);
      } else {
        const data = await res.json();
        setFeedback('error');
        setFeedbackText(data.error || 'Erro ao salvar');
        setTimeout(() => {
          setFeedback('idle');
          setFeedbackText('');
        }, 3000);
      }
    } catch {
      setFeedback('error');
      setFeedbackText('Erro de conexão');
      setTimeout(() => {
        setFeedback('idle');
        setFeedbackText('');
      }, 3000);
    }
  }, [poolId, match.id]);

  const handleStep = useCallback((side: 'home' | 'away', direction: 'up' | 'down') => {
    const currentStr = side === 'home' ? homeGuess : awayGuess;
    const currentVal = currentStr === '' ? -1 : parseInt(currentStr, 10);
    
    let newVal = direction === 'up' ? currentVal + 1 : currentVal - 1;
    if (newVal < 0) newVal = 0;
    if (newVal > 20) newVal = 20;

    const valStr = newVal.toString();
    if (side === 'home') setHomeGuess(valStr);
    else setAwayGuess(valStr);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    const newHome = side === 'home' ? valStr : homeGuess;
    const newAway = side === 'away' ? valStr : awayGuess;

    let penWinner = penaltyWinnerGuess;
    if (newHome !== newAway) {
      penWinner = null;
      setPenaltyWinnerGuess(null);
    }

    if (newHome !== '' && newAway !== '') {
      saveTimerRef.current = setTimeout(() => {
        savePrediction(newHome, newAway, penWinner);
      }, 800);
    }
  }, [homeGuess, awayGuess, penaltyWinnerGuess, savePrediction, match.stage]);

  const handlePenaltySelection = useCallback((winner: 'home' | 'away') => {
    setPenaltyWinnerGuess(winner);
    if (homeGuess !== '' && awayGuess !== '') {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      savePrediction(homeGuess, awayGuess, winner);
    }
  }, [homeGuess, awayGuess, savePrediction]);

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const statusLabel = match.status === 'live' ? 'AO VIVO'
    : match.status === 'finished' ? 'Encerrado'
    : toDisplayTime(match.kickoffAt);

  return (
    <div className={styles.matchCard} data-status={match.status}>
      {/* Meta: grupo + status */}
      <div className={styles.matchMeta}>
        <span>{match.groupName || `Rodada ${match.matchday}`}</span>
        <span className={styles.matchStatus} data-status={match.status}>
          {match.status === 'live' && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'currentColor', display: 'inline-block' }} />}
          {statusLabel}
        </span>
      </div>

      {/* Times e placar real */}
      <div className={styles.matchTeams}>
        <div className={styles.teamBlock}>
          {match.homeTeamCrest && (
            <img src={match.homeTeamCrest} alt={match.homeTeam} className={styles.teamCrest} />
          )}
          <span className={styles.teamName}>{match.homeTeam}</span>
        </div>

        <div className={styles.matchScore}>
          {match.status !== 'scheduled' ? (
            <>
              <span>{match.homeScore ?? 0}</span>
              <span className={styles.scoreSeparator}>×</span>
              <span>{match.awayScore ?? 0}</span>
            </>
          ) : (
            <span className={styles.scoreSeparator} style={{ fontSize: 'var(--text-xl)' }}>vs</span>
          )}
        </div>

        <div className={styles.teamBlock}>
          {match.awayTeamCrest && (
            <img src={match.awayTeamCrest} alt={match.awayTeam} className={styles.teamCrest} />
          )}
          <span className={styles.teamName}>{match.awayTeam}</span>
        </div>
      </div>

      {/* Palpite */}
      {editable ? (
        // Jogo aberto: formulário de palpite
        <>
          <p className={styles.predictionLabel}>Seu palpite</p>
          <div className={styles.predictionForm}>
            
            <div className={styles.stepperContainer}>
              <button type="button" className={styles.stepperBtn} onClick={() => handleStep('home', 'up')} aria-label={`Aumentar gols ${match.homeTeam}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
              </button>
              <div className={styles.scoreDisplay}>{homeGuess === '' ? '-' : homeGuess}</div>
              <button type="button" className={styles.stepperBtn} onClick={() => handleStep('home', 'down')} aria-label={`Diminuir gols ${match.homeTeam}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
            </div>

            <span className={styles.predictionX}>×</span>
            
            <div className={styles.stepperContainer}>
              <button type="button" className={styles.stepperBtn} onClick={() => handleStep('away', 'up')} aria-label={`Aumentar gols ${match.awayTeam}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
              </button>
              <div className={styles.scoreDisplay}>{awayGuess === '' ? '-' : awayGuess}</div>
              <button type="button" className={styles.stepperBtn} onClick={() => handleStep('away', 'down')} aria-label={`Diminuir gols ${match.awayTeam}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
            </div>

          </div>

          {/* Feedback */}
          <div className={styles.predictionFeedback} data-state={feedback}>
            {feedbackText && <span>{feedbackText}</span>}
          </div>

          {match.stage && match.stage !== 'GROUP_STAGE' && homeGuess !== '' && awayGuess !== '' && homeGuess === awayGuess && (
            <div style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>
                Vencedor nos Pênaltis:
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => handlePenaltySelection('home')}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: penaltyWinnerGuess === 'home' ? 'var(--color-brand-green)' : 'transparent',
                    color: penaltyWinnerGuess === 'home' ? 'white' : 'var(--color-text)',
                    fontWeight: penaltyWinnerGuess === 'home' ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                >
                  {match.homeTeam}
                </button>
                <button
                  type="button"
                  onClick={() => handlePenaltySelection('away')}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: penaltyWinnerGuess === 'away' ? 'var(--color-brand-green)' : 'transparent',
                    color: penaltyWinnerGuess === 'away' ? 'white' : 'var(--color-text)',
                    fontWeight: penaltyWinnerGuess === 'away' ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                >
                  {match.awayTeam}
                </button>
              </div>
            </div>
          )}

          {/* Deadline */}
          <p className={styles.deadlineText}>
            ⏱ Fecha em {formatCountdown(match.kickoffAt)}
          </p>
        </>
      ) : (
        // Palpite travado, ao vivo ou encerrado
        <div style={{ textAlign: 'center' }}>
          {existingPrediction ? (
            <>
              <p className={styles.predictionLabel}>
                Seu palpite: {existingPrediction.home_guess} × {existingPrediction.away_guess}
                {existingPrediction.home_guess === existingPrediction.away_guess && existingPrediction.penalty_winner_guess && (
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-warning)', marginTop: 4 }}>
                    ({existingPrediction.penalty_winner_guess === 'home' ? match.homeTeam : match.awayTeam} vence nos pênaltis)
                  </span>
                )}
                {match.status === 'scheduled' ? ' (travado)' : ''}
              </p>
              {existingPrediction.points !== null && existingPrediction.points !== undefined && (
                <span
                  className={styles.pointsBadge}
                  data-points={existingPrediction.points.toString()}
                >
                  {existingPrediction.points} pts
                </span>
              )}
            </>
          ) : (
            <div className={styles.predictionFeedback} data-state="locked">
              {match.status === 'scheduled' ? '🔒 Palpite encerrado' : 'Sem palpite registrado'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
