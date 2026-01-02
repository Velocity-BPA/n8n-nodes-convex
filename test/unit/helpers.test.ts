/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  formatNumber,
  formatPercentage,
  formatUsd,
  parseApy,
  calculateBoost,
  calculateUnlockDate,
  getNextGaugeVoteDate,
  validateRequiredParam,
  safeJsonParse,
} from '../../nodes/Convex/utils/helpers';

describe('Helper Functions', () => {
  describe('formatNumber', () => {
    it('should format billions correctly', () => {
      expect(formatNumber(1_500_000_000)).toBe('1.50B');
      expect(formatNumber(2_000_000_000)).toBe('2.00B');
    });

    it('should format millions correctly', () => {
      expect(formatNumber(1_500_000)).toBe('1.50M');
      expect(formatNumber(999_999_999)).toBe('1000.00M');
    });

    it('should format thousands correctly', () => {
      expect(formatNumber(1_500)).toBe('1.50K');
      expect(formatNumber(999_999)).toBe('1000.00K');
    });

    it('should format small numbers correctly', () => {
      expect(formatNumber(500)).toBe('500.00');
      expect(formatNumber(0.5)).toBe('0.50');
    });

    it('should respect custom decimals', () => {
      expect(formatNumber(1_500_000, 3)).toBe('1.500M');
      expect(formatNumber(1_500_000, 0)).toBe('2M');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(5.5)).toBe('5.50%');
      expect(formatPercentage(100)).toBe('100.00%');
      expect(formatPercentage(0.01)).toBe('0.01%');
    });

    it('should respect custom decimals', () => {
      expect(formatPercentage(5.555, 1)).toBe('5.6%');
      expect(formatPercentage(5.555, 3)).toBe('5.555%');
    });
  });

  describe('formatUsd', () => {
    it('should format USD values correctly', () => {
      expect(formatUsd(1_500_000_000)).toBe('$1.50B');
      expect(formatUsd(1_500_000)).toBe('$1.50M');
      expect(formatUsd(1_500)).toBe('$1.50K');
      expect(formatUsd(500)).toBe('$500.00');
    });
  });

  describe('parseApy', () => {
    it('should parse number values', () => {
      expect(parseApy(5.5)).toBe(5.5);
      expect(parseApy(0)).toBe(0);
    });

    it('should parse string values', () => {
      expect(parseApy('5.5')).toBe(5.5);
      expect(parseApy('0')).toBe(0);
    });

    it('should handle null/undefined', () => {
      expect(parseApy(null)).toBe(0);
      expect(parseApy(undefined)).toBe(0);
    });

    it('should handle invalid strings', () => {
      expect(parseApy('invalid')).toBe(0);
    });
  });

  describe('calculateBoost', () => {
    it('should return 1 when totalSupply is 0', () => {
      expect(calculateBoost(100, 0, 50, 1000)).toBe(1);
    });

    it('should return 1 when totalVeCrv is 0', () => {
      expect(calculateBoost(100, 1000, 50, 0)).toBe(1);
    });

    it('should calculate boost within valid range', () => {
      const boost = calculateBoost(100, 1000, 50, 500);
      expect(boost).toBeGreaterThanOrEqual(1);
      expect(boost).toBeLessThanOrEqual(2.5);
    });

    it('should cap boost at 2.5x', () => {
      const boost = calculateBoost(100, 1000, 1000, 100);
      expect(boost).toBeLessThanOrEqual(2.5);
    });
  });

  describe('calculateUnlockDate', () => {
    it('should calculate unlock date correctly', () => {
      const lockTimestamp = Date.now();
      const unlockDate = calculateUnlockDate(lockTimestamp, 16);
      
      // 16 weeks + 1 day in milliseconds
      const expectedDuration = 16 * 7 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000;
      const expectedDate = new Date(lockTimestamp + expectedDuration);
      
      expect(unlockDate.getTime()).toBe(expectedDate.getTime());
    });

    it('should use default 16 weeks', () => {
      const lockTimestamp = Date.now();
      const unlockDate = calculateUnlockDate(lockTimestamp);
      
      const expectedDuration = 16 * 7 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000;
      const expectedDate = new Date(lockTimestamp + expectedDuration);
      
      expect(unlockDate.getTime()).toBe(expectedDate.getTime());
    });
  });

  describe('getNextGaugeVoteDate', () => {
    it('should return a Date object', () => {
      const nextVote = getNextGaugeVoteDate();
      expect(nextVote).toBeInstanceOf(Date);
    });

    it('should return a Thursday', () => {
      const nextVote = getNextGaugeVoteDate();
      expect(nextVote.getDay()).toBe(4); // Thursday = 4
    });

    it('should return a date in the future or today', () => {
      const nextVote = getNextGaugeVoteDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(nextVote.getTime()).toBeGreaterThanOrEqual(today.getTime());
    });
  });

  describe('validateRequiredParam', () => {
    it('should not throw for valid values', () => {
      expect(() => validateRequiredParam('test', 'param')).not.toThrow();
      expect(() => validateRequiredParam(123, 'param')).not.toThrow();
      expect(() => validateRequiredParam(false, 'param')).not.toThrow();
    });

    it('should throw for null', () => {
      expect(() => validateRequiredParam(null, 'param')).toThrow('Required parameter "param" is missing or empty');
    });

    it('should throw for undefined', () => {
      expect(() => validateRequiredParam(undefined, 'param')).toThrow('Required parameter "param" is missing or empty');
    });

    it('should throw for empty string', () => {
      expect(() => validateRequiredParam('', 'param')).toThrow('Required parameter "param" is missing or empty');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"key": "value"}', {})).toEqual({ key: 'value' });
      expect(safeJsonParse('[1, 2, 3]', [])).toEqual([1, 2, 3]);
    });

    it('should return default for invalid JSON', () => {
      expect(safeJsonParse('invalid', { default: true })).toEqual({ default: true });
      expect(safeJsonParse('', [])).toEqual([]);
    });
  });
});
