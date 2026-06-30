/**
 * football.ts — Interface única para a fonte de dados de futebol.
 *
 * Toda chamada à API de futebol DEVE passar por footballDataSource.
 * Para trocar a fonte: implemente FootballDataSource em uma nova classe
 * e substitua o export no final deste arquivo.
 *
 * Fonte atual: football-data.org (API v4)
 * Competição: WC (FIFA World Cup 2026)
 * Rate limit: ~10 req/min (plano free)
 */

import type {
  FootballDataApiMatch,
  FootballDataApiMatchesResponse,
  FootballDataApiMatchStatus,
} from '@/types/football-api.types';
import { createClient } from '@supabase/supabase-js';
import { getTodayDateString, getDateRangeInUTC } from '@/utils/date';

// ─── Tipos públicos ────────────────────────────────────────────────────────────

/** Representação interna de um jogo de futebol */
export interface FootballMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamCrest: string | null;
  awayTeamCrest: string | null;
  kickoffAt: string; // ISO 8601 UTC
  status: 'scheduled' | 'live' | 'finished';
  homeScore: number | null;
  awayScore: number | null;
  matchday: number | null;
  groupName: string | null;
  stage: string;
  penaltyWinner: 'home' | 'away' | null;
}

/** Contrato que toda fonte de dados de futebol deve implementar */
export interface FootballDataSource {
  /** Retorna os jogos do dia atual (fuso America/Sao_Paulo) */
  getTodaysMatches(): Promise<FootballMatch[]>;
  /** Retorna todos os jogos desde o início da Copa até hoje */
  getHistoricalMatches(): Promise<FootballMatch[]>;
  /** Busca o resultado de um jogo específico pelo ID externo */
  getMatchResult(id: number): Promise<FootballMatch | null>;
  /** Sincroniza jogos de um intervalo de datas com o banco */
  syncMatches(dateFrom: string, dateTo: string): Promise<number>;
}

// ─── Constantes ────────────────────────────────────────────────────────────────

const COMPETITION_CODE = 'WC';
const BASE_URL = 'https://api.football-data.org/v4';
const CACHE_TTL_MS = 60 * 60 * 1000;       // 1 hora para jogos do dia
const LIVE_CACHE_TTL_MS = 1 * 60 * 1000;    // 1 minuto para jogos ao vivo

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Mapeia o status da API externa para o status interno do app */
function mapApiStatus(apiStatus: FootballDataApiMatchStatus): 'scheduled' | 'live' | 'finished' {
  switch (apiStatus) {
    case 'SCHEDULED':
    case 'TIMED':
      return 'scheduled';
    case 'IN_PLAY':
    case 'PAUSED':
      return 'live';
    case 'FINISHED':
    case 'AWARDED':
      return 'finished';
    case 'SUSPENDED':
    case 'POSTPONED':
    case 'CANCELLED':
    default:
      return 'scheduled';
  }
}

/** Formata o nome do grupo: "GROUP_A" → "Grupo A" */
function formatGroupName(group: string | null): string | null {
  if (!group) return null;
  const letter = group.replace('GROUP_', '');
  return `Grupo ${letter}`;
}

/**
 * Retorna o placar do tempo normal de um jogo da API.
 *
 * ⚠️  A API football-data.org retorna em `score.fullTime` o placar ACUMULADO
 * (tempo normal + pênaltis) quando o jogo vai a pênaltis. O placar real do
 * tempo normal fica em `score.regularTime`. Exemplo: jogo 1×1 com pênaltis
 * 3×2 → fullTime = 4×3, regularTime = 1×1.
 *
 * Estratégia (em ordem de prioridade):
 *   1. Usa `regularTime` diretamente (campo preferencial).
 *   2. Se `regularTime` for nulo, calcula `fullTime − penalties` (fallback).
 *   3. Se `penalties` também for nulo, usa `fullTime` como último recurso.
 */
function getRegularTimeScore(apiMatch: FootballDataApiMatch): { home: number | null; away: number | null } {
  if (apiMatch.score.duration !== 'PENALTY_SHOOTOUT') {
    return apiMatch.score.fullTime;
  }

  // 1ª opção: regularTime (campo mais confiável)
  if (
    apiMatch.score.regularTime &&
    apiMatch.score.regularTime.home !== null &&
    apiMatch.score.regularTime.away !== null
  ) {
    return apiMatch.score.regularTime;
  }

  // 2ª opção: calcular a partir de fullTime − penalties
  const penalties = apiMatch.score.penalties;
  const full      = apiMatch.score.fullTime;

  if (
    penalties &&
    penalties.home !== null &&
    penalties.away !== null &&
    full.home     !== null &&
    full.away     !== null
  ) {
    return {
      home: full.home - penalties.home,
      away: full.away - penalties.away,
    };
  }

  // 3ª opção: último recurso (pode estar errado para pênaltis, mas é o que temos)
  console.warn(`[football.ts] Jogo ${apiMatch.id}: PENALTY_SHOOTOUT sem regularTime nem penalties — usando fullTime como fallback.`);
  return apiMatch.score.fullTime;
}


/** Converte um jogo da API externa para o formato interno */
function mapApiMatchToInternal(apiMatch: FootballDataApiMatch): FootballMatch {
  let penaltyWinner: 'home' | 'away' | null = null;
  if (apiMatch.score.duration === 'PENALTY_SHOOTOUT' && apiMatch.score.winner) {
    penaltyWinner = apiMatch.score.winner === 'HOME_TEAM' ? 'home' : 'away';
  }

  const regularScore = getRegularTimeScore(apiMatch);

  return {
    id: apiMatch.id,
    homeTeam: apiMatch.homeTeam?.shortName || apiMatch.homeTeam?.name || 'A definir',
    awayTeam: apiMatch.awayTeam?.shortName || apiMatch.awayTeam?.name || 'A definir',
    homeTeamCrest: apiMatch.homeTeam?.crest || null,
    awayTeamCrest: apiMatch.awayTeam?.crest || null,
    kickoffAt: apiMatch.utcDate,
    status: mapApiStatus(apiMatch.status),
    homeScore: regularScore.home,
    awayScore: regularScore.away,
    matchday: apiMatch.matchday || null,
    groupName: formatGroupName(apiMatch.group),
    stage: apiMatch.stage || 'GROUP_STAGE',
    penaltyWinner,
  };
}

/** Cria o cliente Supabase para inserir/atualizar matches */
function createMatchesClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('[football.ts] Variáveis SUPABASE_URL ou chave de acesso ausentes.');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── Implementação football-data.org ───────────────────────────────────────────

class FootballDataOrg implements FootballDataSource {
  private get apiKey(): string {
    const key = process.env.FOOTBALL_DATA_API_KEY;
    if (!key) {
      throw new Error('[football.ts] FOOTBALL_DATA_API_KEY não configurada.');
    }
    return key;
  }

  private get headers(): Record<string, string> {
    return { 'X-Auth-Token': this.apiKey };
  }

  /**
   * Busca jogos da API football-data.org para um intervalo de datas.
   * Formato das datas: YYYY-MM-DD
   */
  private async fetchMatchesFromApi(dateFrom: string, dateTo: string): Promise<FootballDataApiMatch[]> {
    const url = `${BASE_URL}/competitions/${COMPETITION_CODE}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;

    console.log(`[football.ts] Buscando jogos da API: ${dateFrom} a ${dateTo}`);

    const response = await fetch(url, {
      headers: this.headers,
      next: { revalidate: 0 }, // Desabilita cache do Next.js neste fetch
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[football.ts] Erro na API (${response.status}):`, errorText);

      // Se a competição não existe ainda (404), retornar vazio em vez de explodir
      if (response.status === 404) {
        console.warn('[football.ts] Competição WC não encontrada na API. A Copa pode não ter começado ainda.');
        return [];
      }

      throw new Error(`Erro ao buscar jogos: ${response.status} - ${errorText}`);
    }

    const data: FootballDataApiMatchesResponse = await response.json();
    console.log(`[football.ts] ${data.matches.length} jogos recebidos da API.`);

    return data.matches;
  }

  /**
   * Faz upsert dos jogos no banco de dados (INSERT ON CONFLICT UPDATE).
   * Usa service_role para bypassar RLS.
   */
  private async upsertMatchesToDb(apiMatches: FootballDataApiMatch[]): Promise<number> {
    if (apiMatches.length === 0) return 0;

    const supabase = createMatchesClient();
    const now = new Date().toISOString();

    const rows = apiMatches.map((m) => {
      const regularScore = getRegularTimeScore(m);
      return {
        id: m.id,
        home_team: m.homeTeam?.shortName || m.homeTeam?.name || 'A definir',
        away_team: m.awayTeam?.shortName || m.awayTeam?.name || 'A definir',
        kickoff_at: m.utcDate,
        status: mapApiStatus(m.status),
        // Usar placar do tempo normal, não o acumulado com pênaltis
        home_score: regularScore.home,
        away_score: regularScore.away,
        matchday: m.matchday || null,
        home_team_crest: m.homeTeam?.crest || null,
        away_team_crest: m.awayTeam?.crest || null,
        group_name: formatGroupName(m.group),
        stage: m.stage || 'GROUP_STAGE',
        penalty_winner: m.score.duration === 'PENALTY_SHOOTOUT' && m.score.winner 
          ? (m.score.winner === 'HOME_TEAM' ? 'home' : 'away') 
          : null,
        last_synced_at: now,
      };
    });

    const { error } = await supabase
      .from('matches')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('[football.ts] Erro no upsert:', error);
      throw new Error(`Erro ao salvar jogos no banco: ${error.message}`);
    }

    console.log(`[football.ts] ${rows.length} jogos salvos/atualizados no banco.`);
    return rows.length;
  }

  /**
   * Busca jogos do banco que estão no cache (sem bater na API).
   */
  private async getMatchesFromDb(dateFrom: string, dateTo: string): Promise<FootballMatch[]> {
    const supabase = createMatchesClient();

    // dateFrom e dateTo são YYYY-MM-DD, precisamos converter para range UTC
    // usando fuso local para incluir jogos que passam da meia-noite UTC mas ainda são do mesmo dia local
    const { start: startUtc, end: endUtc } = getDateRangeInUTC(dateFrom, dateTo);

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .gte('kickoff_at', startUtc)
      .lte('kickoff_at', endUtc)
      .order('kickoff_at', { ascending: true });

    if (error) {
      console.error('[football.ts] Erro ao buscar do banco:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((row) => {
      let derivedStatus = row.status as 'scheduled' | 'live' | 'finished';
      
      // Força "live" se o jogo passou do horário e a API externa ainda não atualizou
      if (derivedStatus === 'scheduled' && new Date(row.kickoff_at).getTime() <= Date.now()) {
        derivedStatus = 'live';
      }

      return {
        id: row.id,
        homeTeam: row.home_team,
        awayTeam: row.away_team,
        homeTeamCrest: row.home_team_crest || null,
        awayTeamCrest: row.away_team_crest || null,
        kickoffAt: row.kickoff_at,
        status: derivedStatus,
        homeScore: row.home_score,
        awayScore: row.away_score,
        matchday: row.matchday || null,
        groupName: row.group_name || null,
        stage: row.stage || 'GROUP_STAGE',
        penaltyWinner: row.penalty_winner || null,
      };
    });
  }

  /**
   * Verifica se o cache do banco está fresco o suficiente.
   */
  private async isCacheFresh(dateFrom: string, dateTo: string): Promise<boolean> {
    const supabase = createMatchesClient();

    const { start: startUtc, end: endUtc } = getDateRangeInUTC(dateFrom, dateTo);

    const { data } = await supabase
      .from('matches')
      .select('status, last_synced_at, kickoff_at')
      .gte('kickoff_at', startUtc)
      .lte('kickoff_at', endUtc);

    if (!data || data.length === 0) return false;

    const now = Date.now();
    let hasLiveMatches = false;
    let oldestSync = now;

    // Verificar se há ALGUM jogo ao vivo no sistema, mesmo de dias anteriores
    const { data: globalLive } = await supabase
      .from('matches')
      .select('id, last_synced_at')
      .or(`status.eq.live,and(status.eq.scheduled,kickoff_at.lte.${new Date().toISOString()})`);
      
    if (globalLive && globalLive.length > 0) {
      hasLiveMatches = true;
      // Se há jogos ao vivo, a frescura do cache é baseada neles
      oldestSync = Math.min(...globalLive.map(m => new Date(m.last_synced_at || 0).getTime()));
    } else if (data && data.length > 0) {
      // Se não há jogos ao vivo, a frescura é baseada nos jogos do período solicitado (hoje)
      oldestSync = Math.min(...data.map(m => new Date(m.last_synced_at || 0).getTime()));
    } else {
      // Se não há jogos de forma alguma, força o sync
      oldestSync = 0;
    }

    const ttl = hasLiveMatches ? LIVE_CACHE_TTL_MS : CACHE_TTL_MS;
    const age = now - oldestSync;

    return age < ttl;
  }

  // ─── Métodos públicos (implementam FootballDataSource) ─────────────────────

  async getTodaysMatches(): Promise<FootballMatch[]> {
    const today = getTodayDateString();

    // 1. Verifica se o cache está fresco
    const fresh = await this.isCacheFresh(today, today);

    if (!fresh) {
      // 2. Se stale, buscar da API (com margem de 1 dia para fuso UTC) e salvar no banco
      try {
        const todayDate = new Date();
        
        const yesterdayDate = new Date(todayDate);
        yesterdayDate.setDate(todayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
        
        const tomorrowDate = new Date(todayDate);
        tomorrowDate.setDate(todayDate.getDate() + 1);
        const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

        const apiMatches = await this.fetchMatchesFromApi(yesterdayStr, tomorrowStr);
        await this.upsertMatchesToDb(apiMatches);
      } catch (error) {
        console.error('[football.ts] Falha ao sincronizar, usando cache existente:', error);
        // Continua e retorna o que tiver no banco (graceful degradation)
      }
    }

    // 3. Sempre retornar do banco (fonte de verdade)
    return this.getMatchesFromDb(today, today);
  }

  async getHistoricalMatches(): Promise<FootballMatch[]> {
    const today = getTodayDateString();
    // Data de início da Copa do Mundo de 2026
    const startDate = '2026-06-11';
    
    // Retorna do banco todos os jogos entre o início da copa e hoje
    return this.getMatchesFromDb(startDate, today);
  }

  async getMatchResult(id: number): Promise<FootballMatch | null> {
    const supabase = createMatchesClient();

    // 1. Buscar do banco
    const { data: row, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !row) return null;

    // 2. Se não está finalizado e o cache está velho, buscar atualização
    if (row.status !== 'finished') {
      const lastSync = new Date(row.last_synced_at || 0).getTime();
      const age = Date.now() - lastSync;

      if (age > LIVE_CACHE_TTL_MS) {
        try {
          // Buscar só este jogo pela data dele
          const dateStr = row.kickoff_at.split('T')[0];
          const apiMatches = await this.fetchMatchesFromApi(dateStr, dateStr);
          const match = apiMatches.find((m) => m.id === id);

          if (match) {
            await this.upsertMatchesToDb([match]);

            // Retornar dados atualizados
            return mapApiMatchToInternal(match);
          }
        } catch (error) {
          console.error(`[football.ts] Falha ao atualizar jogo ${id}:`, error);
        }
      }
    }

    // 3. Retornar do banco
    return {
      id: row.id,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      homeTeamCrest: row.home_team_crest || null,
      awayTeamCrest: row.away_team_crest || null,
      kickoffAt: row.kickoff_at,
      status: row.status as 'scheduled' | 'live' | 'finished',
      homeScore: row.home_score,
      awayScore: row.away_score,
      matchday: row.matchday || null,
      groupName: row.group_name || null,
      stage: row.stage || 'GROUP_STAGE',
      penaltyWinner: row.penalty_winner || null,
    };
  }

  async syncMatches(dateFrom: string, dateTo: string): Promise<number> {
    // Para garantir que não percamos jogos devido ao fuso horário (ex: jogos 23h SP -> 02h UTC do dia seguinte),
    // vamos adicionar uma margem de segurança de 1 dia antes e 1 dia depois na requisição da API externa.
    const fromDate = new Date(`${dateFrom}T12:00:00Z`);
    fromDate.setDate(fromDate.getDate() - 1);
    const paddedDateFrom = fromDate.toISOString().split('T')[0];

    const toDate = new Date(`${dateTo}T12:00:00Z`);
    toDate.setDate(toDate.getDate() + 1);
    const paddedDateTo = toDate.toISOString().split('T')[0];

    // 1. Buscar todos os jogos do intervalo na API
    const apiMatches = await this.fetchMatchesFromApi(paddedDateFrom, paddedDateTo);

    // 2. Salvar no banco (isso faz upsert de todos, que ficarão em cache)
    const count = await this.upsertMatchesToDb(apiMatches);

    return count;
  }
}

// Singleton exportado — troque a classe para mudar a fonte de dados
export const footballDataSource: FootballDataSource = new FootballDataOrg();

