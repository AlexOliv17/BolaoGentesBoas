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
 * @returns 8, 5 ou 0
 *
 * @example
 * calculatePoints(2, 1, 2, 1) // → 8 (placar exato)
 * calculatePoints(2, 0, 3, 0) // → 5 (acertou vitória do mandante)
 * calculatePoints(1, 1, 2, 2) // → 5 (acertou empate)
 * calculatePoints(1, 0, 0, 1) // → 0 (errou o resultado)
 */
export function calculatePoints(
  homeGuess: number,
  awayGuess: number,
  homeScore: number,
  awayScore: number,
): number {
  // Placar exato — 8 pontos
  if (homeGuess === homeScore && awayGuess === awayScore) {
    return 8;
  }

  // Resultado correto (sem placar exato) — 5 pontos
  if (getResult(homeGuess, awayGuess) === getResult(homeScore, awayScore)) {
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
