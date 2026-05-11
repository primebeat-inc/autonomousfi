import { describe, it, expect } from 'vitest';
import {
  scoreToScaled,
  scaledToScore,
  isValidPrice,
  asAgentAddress,
  asTaskId,
  asPrice,
  MAX_U64,
  type TaskId,
  type Price
} from '../src/types.js';

describe('scoreToScaled / scaledToScore', () => {
  it('round-trips 0.5 exactly', () => {
    expect(scaledToScore(scoreToScaled(0.5))).toBe(0.5);
  });

  it('clamps over-range scores to [0, 1]', () => {
    expect(scoreToScaled(1.5)).toBe(1_000_000);
    expect(scoreToScaled(-0.2)).toBe(0);
  });

  it('uses 1e6 fixed-point scale matching spec §7.1', () => {
    expect(scoreToScaled(0.85)).toBe(850_000);
  });
});

describe('isValidPrice', () => {
  it('accepts positive bigint up to 2^64-1', () => {
    expect(isValidPrice(1n)).toBe(true);
    expect(isValidPrice(2n ** 64n - 1n)).toBe(true);
  });

  it('rejects zero, negative, or oversized prices', () => {
    expect(isValidPrice(0n)).toBe(false);
    expect(isValidPrice(-1n)).toBe(false);
    expect(isValidPrice(2n ** 64n)).toBe(false);
  });
});

import fc from 'fast-check';

describe('scoreToScaled property: monotonicity', () => {
  it('is non-decreasing in input', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (a, b) => {
          if (a <= b) {
            expect(scoreToScaled(a)).toBeLessThanOrEqual(scoreToScaled(b));
          }
        }
      )
    );
  });
});

describe('asAgentAddress', () => {
  it('brands valid 0x-prefixed hex strings', () => {
    expect(asAgentAddress('0xAAAA')).toBe('0xAAAA');
    expect(asAgentAddress('0xdeadbeef')).toBe('0xdeadbeef');
  });

  it('rejects strings without 0x prefix', () => {
    expect(() => asAgentAddress('AAAA')).toThrow(/0x-prefixed/);
  });

  it('rejects strings with non-hex characters', () => {
    expect(() => asAgentAddress('0xZZZZ')).toThrow(/0x-prefixed/);
  });

  it('rejects bare 0x without hex body', () => {
    expect(() => asAgentAddress('0x')).toThrow(/0x-prefixed/);
  });

  it('rejects empty string', () => {
    expect(() => asAgentAddress('')).toThrow(/0x-prefixed/);
  });
});

describe('asTaskId', () => {
  it('brands non-empty strings', () => {
    expect(asTaskId('task-1')).toBe('task-1');
  });

  it('rejects empty string', () => {
    expect(() => asTaskId('')).toThrow(/empty/);
  });
});

describe('asPrice', () => {
  it('brands valid positive bigints', () => {
    expect(asPrice(1n)).toBe(1n);
    expect(asPrice(MAX_U64)).toBe(MAX_U64);
  });

  it('rejects zero', () => {
    expect(() => asPrice(0n)).toThrow(/not in/);
  });

  it('rejects negative', () => {
    expect(() => asPrice(-1n)).toThrow(/not in/);
  });

  it('rejects oversized values', () => {
    expect(() => asPrice(MAX_U64 + 1n)).toThrow(/not in/);
  });
});
