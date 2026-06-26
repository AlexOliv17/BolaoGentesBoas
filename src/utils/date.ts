/**
 * date.ts — Helpers de data e fuso horário para o BolaoGB.
 *
 * Regra: armazene SEMPRE em UTC no banco (Supabase).
 *        Converta para America/Sao_Paulo APENAS na exibição.
 */

import { toZonedTime, format, fromZonedTime } from 'date-fns-tz';
import { differenceInMilliseconds } from 'date-fns';

/** Fuso horário oficial do projeto */
export const TZ = 'America/Sao_Paulo' as const;

/** Tempo mínimo antes do kickoff para aceitar palpite (1 minuto) */
export const PREDICTION_DEADLINE_MS = 60_000;

/**
 * Converte uma string ISO UTC para exibição no fuso America/Sao_Paulo.
 *
 * @example toDisplayTime('2026-06-15T19:00:00Z') → "15/06 às 16:00"
 */
export function toDisplayTime(utcIso: string): string {
  const date = toZonedTime(new Date(utcIso), TZ);
  return format(date, "dd/MM 'às' HH:mm", { timeZone: TZ });
}

/**
 * Converte uma string ISO UTC para data e hora completa no fuso local.
 *
 * @example toDisplayDateTime('2026-06-15T19:00:00Z') → "15/06/2026 às 16:00"
 */
export function toDisplayDateTime(utcIso: string): string {
  const date = toZonedTime(new Date(utcIso), TZ);
  return format(date, "dd/MM/yyyy 'às' HH:mm", { timeZone: TZ });
}

/**
 * Verifica se o palpite ainda pode ser editado.
 * Retorna true se agora < kickoff_at − 1 minuto.
 *
 * ⚠️  Esta verificação no front é apenas UX — a regra real é validada no servidor.
 */
export function isPredictionEditable(kickoffAtUtc: string): boolean {
  const deadline = new Date(kickoffAtUtc).getTime() - PREDICTION_DEADLINE_MS;
  return Date.now() < deadline;
}

/**
 * Retorna o início e o fim do dia atual em UTC,
 * calculados com base no fuso America/Sao_Paulo.
 */
export function getTodayRangeInUTC(): { start: string; end: string } {
  const nowInTz = toZonedTime(new Date(), TZ);

  // Meia-noite local de hoje
  const startLocal = new Date(
    nowInTz.getFullYear(),
    nowInTz.getMonth(),
    nowInTz.getDate(),
    0, 0, 0, 0,
  );

  // 23:59:59.999 local de hoje
  const endLocal = new Date(
    nowInTz.getFullYear(),
    nowInTz.getMonth(),
    nowInTz.getDate(),
    23, 59, 59, 999,
  );

  // fromZonedTime converte hora local para UTC
  return {
    start: fromZonedTime(startLocal, TZ).toISOString(),
    end:   fromZonedTime(endLocal, TZ).toISOString(),
  };
}

/**
 * Retorna o início e o fim de um intervalo de datas em UTC,
 * calculados com base no fuso America/Sao_Paulo com corte às 06:00 BRT.
 * @param dateFrom Data no formato YYYY-MM-DD
 * @param dateTo Data no formato YYYY-MM-DD
 */
export function getDateRangeInUTC(dateFrom: string, dateTo: string): { start: string; end: string } {
  // O "dia do futebol" vai das 06:00 BRT até as 05:59 BRT do dia seguinte.
  // 06:00 BRT (UTC-3) = 09:00 UTC.
  const startUtc = `${dateFrom}T09:00:00Z`;

  const [tYear, tMonth, tDay] = dateTo.split('-').map(Number);
  const nextDay = new Date(Date.UTC(tYear, tMonth - 1, tDay + 1));
  const nextDayStr = nextDay.toISOString().split('T')[0];
  
  // 05:59:59 BRT do dia seguinte = 08:59:59 UTC do dia seguinte
  const endUtc = `${nextDayStr}T08:59:59Z`;

  return {
    start: startUtc,
    end: endUtc,
  };
}

/**
 * Formata a contagem regressiva até o kickoff.
 *
 * @example formatCountdown('2026-06-15T19:30:00Z') → "1h 30min"
 */
export function formatCountdown(kickoffAtUtc: string): string {
  const now = new Date();
  const kickoff = new Date(kickoffAtUtc);
  const diffMs = differenceInMilliseconds(kickoff, now);

  if (diffMs <= 0) return 'Encerrado';

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

/**
 * Retorna a data atual no fuso de São Paulo como string YYYY-MM-DD.
 * Considera que o "dia" só vira às 6h da manhã.
 */
export function getTodayDateString(): string {
  const nowInTz = toZonedTime(new Date(), TZ);
  if (nowInTz.getHours() < 6) {
    nowInTz.setDate(nowInTz.getDate() - 1);
  }
  return format(nowInTz, 'yyyy-MM-dd', { timeZone: TZ });
}

/**
 * Converte uma ISO date UTC para string YYYY-MM-DD no fuso de São Paulo.
 * Considera que jogos até as 05:59 da manhã pertencem ao dia anterior.
 */
export function toDateString(utcIso: string): string {
  const date = toZonedTime(new Date(utcIso), TZ);
  if (date.getHours() < 6) {
    date.setDate(date.getDate() - 1);
  }
  return format(date, 'yyyy-MM-dd', { timeZone: TZ });
}
