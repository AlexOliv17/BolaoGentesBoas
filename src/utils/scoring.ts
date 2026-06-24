/**
 * scoring.ts — Lógica de pontuação do BolaoGB.
 *
 * Funções puras, sem efeitos colaterais, fáceis de testar unitariamente.
 * Card 8 integrará calculatePoints() ao job de atualização de pontos.
 *
 * Regras:
 *   8 pts — placar exato (ex.: palpite 2×1, resultado 2×1)
 *   5 pts — acertou o resultado (vitória/empate) mas não o placar exato
 *   0 pts — errou o resultado
 */

/** Resultado possível de um jogo */
export type MatchResult = 'home' | 'draw' | 'away';

/**
 * Determina o resultado de um jogo a partir dos gols.
 *
 * @param homeGoals - Gols do time da casa
 * @param awayGoals - Gols do time visitante
 */
export function getResult(homeGoals: number, awayGoals: number): MatchResult {
  if (homeGoals > awayGoals) return 'home';
  if (homeGoals < awayGoals) return 'away';
  return 'draw';
}

/**
 * Calcula a pontuação de um palpite comparado ao resultado real.
 *
 * @param homeGuess  - Palpite: gols do mandante
 * @param awayGuess  - Palpite: gols do visitante
 * @param homeScore  - Resultado real: gols do mandante
 * @param awayScore  - Resultado real: gols do visitante
 * @param isKnockout - Se o jogo é de mata-mata
 * @param penaltyWinnerGuess - Palpite de vencedor dos pênaltis ('home' | 'away' | null)
 * @param actualPenaltyWinner - Vencedor real dos pênaltis ('home' | 'away' | null)
 * @returns 2, 1 ou 0
 */
export function calculatePoints(
  homeGuess: number,
  awayGuess: number,
  homeScore: number,
  awayScore: number,
  isKnockout: boolean = false,
  penaltyWinnerGuess: 'home' | 'away' | null = null,
  actualPenaltyWinner: 'home' | 'away' | null = null,
): number {
  const isExactScore = homeGuess === homeScore && awayGuess === awayScore;

  if (isKnockout) {
    let guessResult: MatchResult | string = getResult(homeGuess, awayGuess);
    if (guessResult === 'draw' && penaltyWinnerGuess) {
      guessResult = penaltyWinnerGuess;
    }

    let matchResult: MatchResult | string = getResult(homeScore, awayScore);
    if (matchResult === 'draw' && actualPenaltyWinner) {
      matchResult = actualPenaltyWinner;
    }

    if (isExactScore) {
      if (homeScore === awayScore) {
        if (penaltyWinnerGuess === actualPenaltyWinner) {
          return 8;
        }
      } else {
        return 8;
      }
    }

    if (guessResult === matchResult) {
      return 5;
    }

    return 0;
  }

  // Lógica original para fase de grupos
  if (isExactScore) {
    return 8;
  }

  const guessResult = getResult(homeGuess, awayGuess);
  const matchResult = getResult(homeScore, awayScore);

  if (guessResult === matchResult) {
    return 5;
  }

  // Errou o resultado — 0 pontos
  return 0;
}

/** Constantes para uso nos componentes de feedback visual */
export const POINTS = {
  EXACT_SCORE: 8,
  CORRECT_RESULT: 5,
  WRONG: 0,
} as const;
