import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getTodayString,
  getGreeting,
  getCurrentQuarter,
  getWeekNumber,
  isWeekendOrFriday,
  isFocusDay,
  formatTime,
} from '../utils';

describe('Utils', () => {
  describe('getTodayString', () => {
    it('returns today in YYYY-MM-DD format', () => {
      const result = getTodayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getGreeting', () => {
    it('returns morning greeting before 12:00', () => {
      vi.setSystemTime(new Date('2024-01-01 08:00:00'));
      expect(getGreeting()).toBe('Goedemorgen, Brein');
    });

    it('returns afternoon greeting between 12:00 and 18:00', () => {
      vi.setSystemTime(new Date('2024-01-01 14:00:00'));
      expect(getGreeting()).toBe('Goedemiddag');
    });

    it('returns evening greeting after 18:00', () => {
      vi.setSystemTime(new Date('2024-01-01 20:00:00'));
      expect(getGreeting()).toBe('Goedenavond');
    });
  });

  describe('getCurrentQuarter', () => {
    it('returns Q1 for January-March', () => {
      vi.setSystemTime(new Date('2024-02-15'));
      expect(getCurrentQuarter()).toBe('Q1');
    });

    it('returns Q2 for April-June', () => {
      vi.setSystemTime(new Date('2024-05-15'));
      expect(getCurrentQuarter()).toBe('Q2');
    });

    it('returns Q3 for July-September', () => {
      vi.setSystemTime(new Date('2024-08-15'));
      expect(getCurrentQuarter()).toBe('Q3');
    });

    it('returns Q4 for October-December', () => {
      vi.setSystemTime(new Date('2024-11-15'));
      expect(getCurrentQuarter()).toBe('Q4');
    });
  });

  describe('getWeekNumber', () => {
    it('returns week number in YYYY-WNN format', () => {
      const result = getWeekNumber(new Date('2024-06-15'));
      expect(result).toMatch(/^\d{4}-W\d{1,2}$/);
    });

    it('calculates correct week number', () => {
      const result = getWeekNumber(new Date('2024-01-08'));
      expect(result).toBe('2024-W2');
    });
  });

  describe('isWeekendOrFriday', () => {
    it('returns true for Friday', () => {
      vi.setSystemTime(new Date('2024-01-05')); // Friday
      expect(isWeekendOrFriday()).toBe(true);
    });

    it('returns true for Saturday', () => {
      vi.setSystemTime(new Date('2024-01-06')); // Saturday
      expect(isWeekendOrFriday()).toBe(true);
    });

    it('returns true for Sunday', () => {
      vi.setSystemTime(new Date('2024-01-07')); // Sunday
      expect(isWeekendOrFriday()).toBe(true);
    });

    it('returns false for Monday-Thursday', () => {
      vi.setSystemTime(new Date('2024-01-03')); // Wednesday
      expect(isWeekendOrFriday()).toBe(false);
    });
  });

  describe('isFocusDay', () => {
    it('returns true for Monday', () => {
      vi.setSystemTime(new Date('2024-01-01')); // Monday
      expect(isFocusDay()).toBe(true);
    });

    it('returns true for Tuesday', () => {
      vi.setSystemTime(new Date('2024-01-02')); // Tuesday
      expect(isFocusDay()).toBe(true);
    });

    it('returns true for Thursday', () => {
      vi.setSystemTime(new Date('2024-01-04')); // Thursday
      expect(isFocusDay()).toBe(true);
    });

    it('returns false for Wednesday, Friday, and weekends', () => {
      vi.setSystemTime(new Date('2024-01-03')); // Wednesday
      expect(isFocusDay()).toBe(false);

      vi.setSystemTime(new Date('2024-01-05')); // Friday
      expect(isFocusDay()).toBe(false);
    });
  });

  describe('formatTime', () => {
    it('formats seconds correctly', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(59)).toBe('00:59');
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(125)).toBe('02:05');
      expect(formatTime(3599)).toBe('59:59');
      expect(formatTime(3600)).toBe('60:00');
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
