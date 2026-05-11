import { describe, it, expect } from 'vitest';
import {
  scoreToScaled,
  scaledToScore,
  isValidPrice,
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
