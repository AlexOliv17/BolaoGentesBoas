/**
 * Tipagem do formato de resposta da API football-data.org v4.
 * Referência: https://docs.football-data.org/general/v4/match.html
 */

export interface FootballDataApiArea {
  id: number;
  name: string;
  code: string;
  flag: string | null;
}

export interface FootballDataApiCompetition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string | null;
}

export interface FootballDataApiSeason {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday: number;
}

export interface FootballDataApiTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;        // Three-letter abbreviation
  crest: string;       // URL do escudo
}

export interface FootballDataApiScoreDetail {
  home: number | null;
  away: number | null;
}

export interface FootballDataApiScore {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT';
  fullTime: FootballDataApiScoreDetail;
  halfTime: FootballDataApiScoreDetail;
  regularTime?: FootballDataApiScoreDetail;
  extraTime?: FootballDataApiScoreDetail;
  penalties?: FootballDataApiScoreDetail;
}

/** Status possíveis de um jogo na API */
export type FootballDataApiMatchStatus =
  | 'SCHEDULED'
  | 'TIMED'
  | 'IN_PLAY'
  | 'PAUSED'
  | 'FINISHED'
  | 'SUSPENDED'
  | 'POSTPONED'
  | 'CANCELLED'
  | 'AWARDED';

export interface FootballDataApiMatch {
  id: number;
  utcDate: string;    // ISO 8601
  status: FootballDataApiMatchStatus;
  matchday: number;
  stage: string;
  group: string | null; // ex: "GROUP_A"
  homeTeam: FootballDataApiTeam;
  awayTeam: FootballDataApiTeam;
  score: FootballDataApiScore;
}

export interface FootballDataApiMatchesResponse {
  filters: Record<string, unknown>;
  resultSet: {
    count: number;
    competitions: string;
    first: string;
    last: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
  };
  matches: FootballDataApiMatch[];
}
