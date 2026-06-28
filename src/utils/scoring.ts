/**
 * scoring.ts — Lógica de pontuação do BolaoGB.
 *
 * Funções puras, sem efeitos colaterais, fáceis de testar unitariamente.
 *
 * Regras — Fase de Grupos:
 *   2 pts — placar exato (ex.: palpite 2×1, resultado 2×1)
 *   1 pt  — acertou o resultado (vitória/empate) mas não o placar exato
 *   0 pts — errou o resultado
 *
 * Regras — Mata-Mata (isKnockout = true):
 *
 *   Palpite de VITÓRIA direta (ex.: 2×0):
 *     • Placar exato no tempo normal                → 2 pts
 *     • Vencedor certo no tempo normal, placar errado → 1 pt
 *     • Jogo foi para pênaltis (empate no tempo normal) → 0 pts
 *     • Vencedor errado                              → 0 pts
 *
 *   Palpite de EMPATE (ex.: 1×1 + escolha de pênalti):
 *     • Placar exato + pênalti certo                → 2 pts
 *     • Placar exato + pênalti errado               → 1 pt
 *     • Placar errado + pênalti certo               → 1 pt
 *     • Placar errado + pênalti errado              → 0 pts
 *     • Jogo não foi para pênaltis (vitória direta) → 0 pts
 *
 *   Obs.: palpite de empate em mata-mata requer obrigatoriamente
 *   o palpite do vencedor dos pênaltis (penaltyWinnerGuess !== null).
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
 * @param homeGuess          - Palpite: gols do mandante
 * @param awayGuess          - Palpite: gols do visitante
 * @param homeScore          - Resultado real: gols do mandante
 * @param awayScore          - Resultado real: gols do visitante
 * @param isKnockout         - Se o jogo é de mata-mata
 * @param penaltyWinnerGuess - Palpite do vencedor dos pênaltis (obrigatório se palpite for empate em mata-mata)
 * @param actualPenaltyWinner - Vencedor real dos pênaltis ('home' | 'away' | null se não houve pênaltis)
 * @returns 2 (placar exato), 1 (resultado certo) ou 0 (errou)
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

  // ── Fase de Grupos ────────────────────────────────────────────────────────
  if (!isKnockout) {
    if (isExactScore) return 2;
    if (getResult(homeGuess, awayGuess) === getResult(homeScore, awayScore)) return 1;
    return 0;
  }

  // ── Mata-Mata ─────────────────────────────────────────────────────────────
  const isDrawGuess  = getResult(homeGuess, awayGuess) === 'draw';
  const isActualDraw = getResult(homeScore, awayScore) === 'draw';

  if (isDrawGuess) {
    // Palpite de empate — pontuação por placar E por pênalti, independentemente
    if (!isActualDraw && !isExactScore) return 0; // vitória direta, placar diferente → 0

    const correctScore   = isExactScore;
    const correctPenalty = penaltyWinnerGuess === actualPenaltyWinner;

    if (correctScore && correctPenalty) return 2; // placar certo + pênalti certo
    if (correctScore || correctPenalty) return 1; // só placar OU só pênalti certo
    return 0;
  }

  // Palpite de vitória direta — jogo que foi para pênaltis zera tudo
  if (isActualDraw) return 0;
  if (isExactScore) return 2;
  if (getResult(homeGuess, awayGuess) === getResult(homeScore, awayScore)) return 1;
  return 0;
}

/** Constantes para uso nos componentes de feedback visual */
export const POINTS = {
  EXACT_SCORE: 2,
  CORRECT_RESULT: 1,
  WRONG: 0,
} as const;
