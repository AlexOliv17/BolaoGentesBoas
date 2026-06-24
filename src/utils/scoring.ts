/**
 * scoring.ts — Lógica de pontuação do BolaoGB.
 *
 * Funções puras, sem efeitos colaterais, fáceis de testar unitariamente.
 * Card 8 integrará calculatePoints() ao job de atualização de pontos.
 *
 * Regras:
 *   2 pts — placar exato (ex.: palpite 2×1, resultado 2×1)
 *   1 pts — acertou o resultado (vitória/empate) mas não o placar exato
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
 * @returns 2, 1 ou 0
 *
 * @example
 * calculatePoints(2, 1, 2, 1) // → 2 (placar exato)
 * calculatePoints(2, 0, 3, 0) // → 1 (acertou vitória do mandante)
 * calculatePoints(1, 1, 2, 2) // → 1 (acertou empate)
 * calculatePoints(1, 2, 2, 1) // → 0 (errou)
 */
export function calculatePoints(
  homeGuess: number,
  awayGuess: number,
  homeScore: number,
  awayScore: number,
): number {
  if (homeGuess === homeScore && awayGuess === awayScore) {
    return 2;
  }

  const guessResult = getResult(homeGuess, awayGuess);
  const matchResult = getResult(homeScore, awayScore);

  if (guessResult === matchResult) {
    return 1;
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
