import { describe, it, expect } from 'vitest';
import {
  AutonomousFiError,
  ERR_INSUFFICIENT_BALANCE,
  ERR_ALREADY_RELEASED,
  ERR_ALREADY_REFUNDED,
  ERR_UNKNOWN_TASK,
  ERR_QUALITY_BELOW_THRESHOLD,
  ERR_HOSTAGE_ALREADY_RESOLVED
} from '../src/errors.js';

describe('AutonomousFiError', () => {
  it('formats message as [code] message', () => {
    const e = new AutonomousFiError('test_code', 'hello world');
    expect(e.message).toBe('[test_code] hello world');
  });

  it('sets name to AutonomousFiError', () => {
    const e = new AutonomousFiError('any', 'any');
    expect(e.name).toBe('AutonomousFiError');
  });

  it('attaches code as readonly public property', () => {
    const e = new AutonomousFiError('the_code', 'msg');
    expect(e.code).toBe('the_code');
  });

  it('extends native Error (instanceof + stack present)', () => {
    const e = new AutonomousFiError('c', 'm');
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(AutonomousFiError);
    expect(e.stack).toBeDefined();
  });

  it('is throwable and catchable via instanceof', () => {
    function thrower(): never {
      throw new AutonomousFiError('thrown', 'from-fn');
    }
    expect(() => thrower()).toThrow(AutonomousFiError);
    expect(() => thrower()).toThrow(/\[thrown\] from-fn/);
  });
});

describe('Error code constants', () => {
  it('exports the stable code strings consumers grep for', () => {
    // If any of these change value, downstream user-facing log greps break.
    expect(ERR_INSUFFICIENT_BALANCE).toBe('insufficient balance');
    expect(ERR_ALREADY_RELEASED).toBe('escrow already released');
    expect(ERR_ALREADY_REFUNDED).toBe('escrow already refunded');
    expect(ERR_UNKNOWN_TASK).toBe('unknown task');
    expect(ERR_QUALITY_BELOW_THRESHOLD).toBe('quality below threshold');
    expect(ERR_HOSTAGE_ALREADY_RESOLVED).toBe('hostage already resolved');
  });

  it('uses distinct strings (no accidental collisions across codes)', () => {
    const codes = [
      ERR_INSUFFICIENT_BALANCE,
      ERR_ALREADY_RELEASED,
      ERR_ALREADY_REFUNDED,
      ERR_UNKNOWN_TASK,
      ERR_QUALITY_BELOW_THRESHOLD,
      ERR_HOSTAGE_ALREADY_RESOLVED
    ];
    expect(new Set(codes).size).toBe(codes.length);
  });
});
