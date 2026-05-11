import { describe, it, expect, beforeEach } from 'vitest';
import { MockChain } from '../src/mock-chain.js';
import { type AgentAddress, type Price } from '../src/types.js';

const A: AgentAddress = '0xAAAA' as AgentAddress;
const B: AgentAddress = '0xBBBB' as AgentAddress;
const TASK_HASH = '0xfeedface' as const;

describe('MockChain — balances', () => {
  let chain: MockChain;
  beforeEach(() => { chain = new MockChain(); });

  it('starts with zero balance for unknown address', () => {
    expect(chain.getUsdtBalance(A)).toBe(0n);
  });

  it('mints USDT to an address', () => {
    chain.mintUsdt(A, 100n);
    expect(chain.getUsdtBalance(A)).toBe(100n);
  });
});

describe('MockChain — escrow', () => {
  it('locks funds into an escrow and lets release pay the provider', () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.escrowLock({ taskHash: TASK_HASH, requester: A, provider: B, price: 100n as Price });
    expect(chain.getUsdtBalance(A)).toBe(900n);
    expect(chain.getEscrowStatus(TASK_HASH)).toBe('locked');

    chain.escrowRelease(TASK_HASH);
    expect(chain.getUsdtBalance(B)).toBe(100n);
    expect(chain.getEscrowStatus(TASK_HASH)).toBe('released');
  });

  it('rejects releasing an already-released escrow', () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.escrowLock({ taskHash: TASK_HASH, requester: A, provider: B, price: 100n as Price });
    chain.escrowRelease(TASK_HASH);
    expect(() => chain.escrowRelease(TASK_HASH)).toThrow(/already released/);
  });

  it('rejects locking when requester has insufficient balance', () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 50n);
    expect(() =>
      chain.escrowLock({ taskHash: TASK_HASH, requester: A, provider: B, price: 100n as Price })
    ).toThrow(/insufficient balance/);
  });
});

describe('MockChain — hostage stake', () => {
  it('stakes from provider balance and slashes to requester on failure', () => {
    const chain = new MockChain();
    chain.mintUsdt(B, 200n);
    chain.hostageStake({ taskHash: TASK_HASH, provider: B, stake: 50n as Price });
    expect(chain.getUsdtBalance(B)).toBe(150n);
    chain.hostageSlash(TASK_HASH, A);
    expect(chain.getUsdtBalance(A)).toBe(50n);
  });

  it('refunds stake on success', () => {
    const chain = new MockChain();
    chain.mintUsdt(B, 200n);
    chain.hostageStake({ taskHash: TASK_HASH, provider: B, stake: 50n as Price });
    chain.hostageRefund(TASK_HASH);
    expect(chain.getUsdtBalance(B)).toBe(200n);
  });
});
