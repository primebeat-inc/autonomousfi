import { describe, it, expect } from 'vitest';
import type { ChainAdapter } from '../src/chain.js';
import { MockChain } from '../src/mock-chain.js';

describe('ChainAdapter conformance', () => {
  it('MockChain conforms to ChainAdapter interface', () => {
    const adapter: ChainAdapter = new MockChain();
    expect(typeof adapter.escrowLock).toBe('function');
    expect(typeof adapter.escrowRelease).toBe('function');
    expect(typeof adapter.hostageSlash).toBe('function');
  });
});
