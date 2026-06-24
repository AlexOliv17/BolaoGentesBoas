import { describe, it, expect } from 'vitest';
import { calculatePoints, getResult } from './scoring';

describe('Scoring Logic', () => {
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

  describe('calculatePoints', () => {
    it('awards 8 points for an exact score match', () => {
      // Home wins exact
      expect(calculatePoints(2, 1, 2, 1)).toBe(8);
      // Away wins exact
      expect(calculatePoints(1, 3, 1, 3)).toBe(8);
      // Draw exact
      expect(calculatePoints(2, 2, 2, 2)).toBe(8);
    });

    it('awards 5 points for correct result but wrong score', () => {
      // Correct home win
      expect(calculatePoints(2, 0, 3, 0)).toBe(5);
      expect(calculatePoints(2, 1, 1, 0)).toBe(5);
      // Correct away win
      expect(calculatePoints(0, 2, 1, 3)).toBe(5);
      expect(calculatePoints(1, 2, 0, 1)).toBe(5);
      // Correct draw
      expect(calculatePoints(0, 0, 1, 1)).toBe(5);
      expect(calculatePoints(2, 2, 0, 0)).toBe(5);
    });

    it('awards 0 points for incorrect result', () => {
      // Predicted home win, was away win
      expect(calculatePoints(2, 1, 1, 2)).toBe(0);
      // Predicted home win, was draw
      expect(calculatePoints(1, 0, 1, 1)).toBe(0);
      // Predicted draw, was home win
      expect(calculatePoints(1, 1, 2, 1)).toBe(0);
      // Predicted away win, was draw
      expect(calculatePoints(0, 1, 0, 0)).toBe(0);
    });
  });
});
