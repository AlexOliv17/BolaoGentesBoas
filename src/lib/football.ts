/**
 * football.ts — Interface trocável para fonte de dados de futebol.
 *
 * Toda chamada à API de futebol DEVE passar por footballDataSource.
 * Para trocar a fonte: implemente FootballDataSource em uma nova classe
 * e substitua o export no final deste arquivo.
 *
 * Card 6 implementará getTodaysMatches() e getMatchResult() com
 * cache no banco (tabela matches) e integração ao football-data.org.
 */

/** Representação interna de um jogo de futebol */
export interface FootballMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string; // ISO 8601 UTC
  status: 'scheduled' | 'live' | 'finished';
  homeScore: number | null;
  awayScore: number | null;
}

/** Contrato que toda fonte de dados de futebol deve implementar */
export interface FootballDataSource {
  /** Retorna os jogos do dia atual (fuso America/Sao_Paulo) */
  getTodaysMatches(): Promise<FootballMatch[]>;
  /** Busca o resultado de um jogo específico pelo ID externo */
  getMatchResult(id: number): Promise<FootballMatch | null>;
}

// ─── Implementação football-data.org (stub — Card 6 completa) ──────────────

class FootballDataOrg implements FootballDataSource {
  private readonly baseUrl = 'https://api.football-data.org/v4';

  private get headers(): Record<string, string> {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) {
      throw new Error('[football.ts] FOOTBALL_DATA_API_KEY não configurada.');
    }
    return { 'X-Auth-Token': apiKey };
  }

  async getTodaysMatches(): Promise<FootballMatch[]> {
    // TODO (Card 6): implementar com cache no banco
    // 1. Verificar tabela matches no Supabase (last_synced_at < 1h)
    // 2. Se stale, buscar da API e atualizar o banco
    // 3. Retornar do banco
    console.warn('[football.ts] getTodaysMatches() ainda não implementado — Card 6.');
    return [];
  }

  async getMatchResult(id: number): Promise<FootballMatch | null> {
    // TODO (Card 6): implementar com cache no banco
    console.warn(`[football.ts] getMatchResult(${id}) ainda não implementado — Card 6.`);
    return null;
  }
}

// Singleton exportado — troque a classe para mudar a fonte de dados
export const footballDataSource: FootballDataSource = new FootballDataOrg();
