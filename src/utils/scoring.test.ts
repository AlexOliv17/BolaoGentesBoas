import { describe, it, expect } from 'vitest';
import { calculatePoints, getResult } from './scoring';

describe('Scoring Logic', () => {
  // ── getResult ──────────────────────────────────────────────────────────────
  describe('getResult', () => {
    it('returns "home" when home team wins', () => {
      expect(getResult(2, 1)).toBe('home');
      expect(getResult(3, 0)).toBe('home');
    });

    it('returns "away" when away team wins', () => {
      expect(getResult(1, 2)).toBe('away');
      expect(getResult(0, 3)).toBe('away');
    });

    it('returns "draw" when there is a tie', () => {
      expect(getResult(1, 1)).toBe('draw');
      expect(getResult(0, 0)).toBe('draw');
    });
  });

  // ── Fase de Grupos ─────────────────────────────────────────────────────────
  describe('calculatePoints — fase de grupos (isKnockout = false)', () => {
    it('retorna 2 pts para placar exato', () => {
      expect(calculatePoints(2, 1, 2, 1)).toBe(2); // vitória mandante exata
      expect(calculatePoints(1, 3, 1, 3)).toBe(2); // vitória visitante exata
      expect(calculatePoints(2, 2, 2, 2)).toBe(2); // empate exato
    });

    it('retorna 1 pt para resultado certo com placar errado', () => {
      // Vitória mandante
      expect(calculatePoints(2, 0, 3, 0)).toBe(1);
      expect(calculatePoints(2, 1, 1, 0)).toBe(1);
      // Vitória visitante
      expect(calculatePoints(0, 2, 1, 3)).toBe(1);
      expect(calculatePoints(1, 2, 0, 1)).toBe(1);
      // Empate
      expect(calculatePoints(0, 0, 1, 1)).toBe(1);
      expect(calculatePoints(2, 2, 0, 0)).toBe(1);
    });

    it('retorna 0 pts para resultado errado', () => {
      expect(calculatePoints(2, 1, 1, 2)).toBe(0); // palpitou mandante, ganhou visitante
      expect(calculatePoints(1, 0, 1, 1)).toBe(0); // palpitou mandante, empatou
      expect(calculatePoints(1, 1, 2, 1)).toBe(0); // palpitou empate, mandante venceu
      expect(calculatePoints(0, 1, 0, 0)).toBe(0); // palpitou visitante, empatou
    });
  });

  // ── Mata-Mata — Palpite de Vitória Direta ─────────────────────────────────
  describe('calculatePoints — mata-mata, palpite de vitória direta', () => {
    it('retorna 2 pts para placar exato no tempo normal', () => {
      expect(calculatePoints(2, 0, 2, 0, true)).toBe(2); // Canadá 2×0 exato
      expect(calculatePoints(0, 1, 0, 1, true)).toBe(2); // visitante exato
    });

    it('retorna 1 pt para vencedor certo com placar errado no tempo normal', () => {
      expect(calculatePoints(2, 0, 3, 0, true)).toBe(1); // Canadá venceu, placar diferente
      expect(calculatePoints(2, 1, 1, 0, true)).toBe(1);
      expect(calculatePoints(0, 2, 1, 3, true)).toBe(1); // visitante venceu, placar diferente
    });

    it('retorna 0 pts quando o jogo foi para pênaltis (palpitou vitória, foi empate)', () => {
      // Palpitou Canadá vencendo, mas ficou 1×1 → pênaltis
      expect(calculatePoints(2, 0, 1, 1, true, null, 'home')).toBe(0);
      expect(calculatePoints(2, 0, 1, 1, true, null, 'away')).toBe(0);
      // Palpitou visitante vencendo, mas ficou 0×0 → pênaltis
      expect(calculatePoints(0, 2, 0, 0, true, null, 'away')).toBe(0);
    });

    it('retorna 0 pts para vencedor errado no tempo normal', () => {
      expect(calculatePoints(2, 0, 0, 1, true)).toBe(0); // palpitou mandante, ganhou visitante
      expect(calculatePoints(0, 1, 1, 0, true)).toBe(0); // palpitou visitante, ganhou mandante
    });
  });

  // ── Mata-Mata — Palpite de Empate ─────────────────────────────────────────
  describe('calculatePoints — mata-mata, palpite de empate com pênalti', () => {
    it('retorna 2 pts para placar exato + pênalti certo', () => {
      // Palpitou 1×1 + Canadá, ficou 1×1, Canadá venceu nos pênaltis
      expect(calculatePoints(1, 1, 1, 1, true, 'home', 'home')).toBe(2);
      // Palpitou 0×0 + visitante, ficou 0×0, visitante venceu nos pênaltis
      expect(calculatePoints(0, 0, 0, 0, true, 'away', 'away')).toBe(2);
    });

    it('retorna 1 pt para placar exato + pênalti errado', () => {
      // Palpitou 1×1 + Canadá, ficou 1×1, mas África do Sul venceu nos pênaltis
      expect(calculatePoints(1, 1, 1, 1, true, 'home', 'away')).toBe(1);
      expect(calculatePoints(0, 0, 0, 0, true, 'away', 'home')).toBe(1);
    });

    it('retorna 1 pt para placar errado + pênalti certo', () => {
      // Palpitou 1×1 + Canadá, ficou 0×0, Canadá venceu nos pênaltis
      expect(calculatePoints(1, 1, 0, 0, true, 'home', 'home')).toBe(1);
      // Palpitou 2×2 + visitante, ficou 1×1, visitante venceu nos pênaltis
      expect(calculatePoints(2, 2, 1, 1, true, 'away', 'away')).toBe(1);
    });

    it('retorna 0 pts para placar errado + pênalti errado', () => {
      // Palpitou 1×1 + Canadá, ficou 0×0, África do Sul venceu nos pênaltis
      expect(calculatePoints(1, 1, 0, 0, true, 'home', 'away')).toBe(0);
      expect(calculatePoints(2, 2, 0, 0, true, 'away', 'home')).toBe(0);
    });

    it('retorna 0 pts quando jogo não foi para pênaltis (palpitou empate, houve vitória direta)', () => {
      // Palpitou 1×1 + Canadá, mas Canadá venceu 2×0 no tempo normal
      expect(calculatePoints(1, 1, 2, 0, true, 'home', null)).toBe(0);
      // Palpitou 0×0 + visitante, mas mandante venceu 1×0 no tempo normal
      expect(calculatePoints(0, 0, 1, 0, true, 'away', null)).toBe(0);
    });
  });
});
