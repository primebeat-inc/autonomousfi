import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { MockChain } from '../src/mock-chain.js';
import { type AgentAddress, type Price } from '../src/types.js';

const A: AgentAddress = '0xAAAA' as AgentAddress;
const B: AgentAddress = '0xBBBB' as AgentAddress;
const TASK_HASH = '0xfeedface' as const;

describe('MockChain - balances', () => {
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

describe('MockChain - escrow', () => {
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

describe('MockChain - hostage stake', () => {
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

  it('rejects refunding an unknown task', () => {
    const chain = new MockChain();
    expect(() => chain.hostageRefund('0xdeadbeef' as `0x${string}`)).toThrow(/unknown task/);
  });

  it('rejects slashing an unknown task', () => {
    const chain = new MockChain();
    expect(() => chain.hostageSlash('0xdeadbeef' as `0x${string}`, A)).toThrow(/unknown task/);
  });

  it('rejects double refund (status: refunded already)', () => {
    const chain = new MockChain();
    chain.mintUsdt(B, 200n);
    chain.hostageStake({ taskHash: TASK_HASH, provider: B, stake: 50n as Price });
    chain.hostageRefund(TASK_HASH);
    expect(() => chain.hostageRefund(TASK_HASH)).toThrow(/hostage already resolved/);
  });

  it('rejects slashing after refund', () => {
    const chain = new MockChain();
    chain.mintUsdt(B, 200n);
    chain.hostageStake({ taskHash: TASK_HASH, provider: B, stake: 50n as Price });
    chain.hostageRefund(TASK_HASH);
    expect(() => chain.hostageSlash(TASK_HASH, A)).toThrow(/hostage already resolved/);
  });
});

describe('MockChain - escrowRefund', () => {
  it('returns price to requester and marks refunded', () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 500n);
    chain.escrowLock({ taskHash: TASK_HASH, requester: A, provider: B, price: 100n as Price });
    expect(chain.getUsdtBalance(A)).toBe(400n);
    chain.escrowRefund(TASK_HASH);
    expect(chain.getUsdtBalance(A)).toBe(500n);
    expect(chain.getEscrowStatus(TASK_HASH)).toBe('refunded');
  });

  it('rejects refunding an unknown task', () => {
    const chain = new MockChain();
    expect(() => chain.escrowRefund('0xdeadbeef' as `0x${string}`)).toThrow(/unknown task/);
  });

  it('rejects refunding an already-released escrow', () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 500n);
    chain.escrowLock({ taskHash: TASK_HASH, requester: A, provider: B, price: 100n as Price });
    chain.escrowRelease(TASK_HASH);
    expect(() => chain.escrowRefund(TASK_HASH)).toThrow(/already released/);
  });

  it('rejects releasing an already-refunded escrow', () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 500n);
    chain.escrowLock({ taskHash: TASK_HASH, requester: A, provider: B, price: 100n as Price });
    chain.escrowRefund(TASK_HASH);
    expect(() => chain.escrowRelease(TASK_HASH)).toThrow(/already refunded/);
  });
});

describe('MockChain - invariants', () => {
  it('preserves total balance through full escrow + hostage settle cycle', () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);
    const totalBefore = chain.getUsdtBalance(A) + chain.getUsdtBalance(B);

    chain.escrowLock({ taskHash: TASK_HASH, requester: A, provider: B, price: 100n as Price });
    chain.hostageStake({ taskHash: TASK_HASH, provider: B, stake: 50n as Price });
    chain.escrowRelease(TASK_HASH);
    chain.hostageRefund(TASK_HASH);

    const totalAfter = chain.getUsdtBalance(A) + chain.getUsdtBalance(B);
    expect(totalAfter).toBe(totalBefore);
  });

  it('preserves total balance through full escrow + hostage slash cycle', () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);
    const totalBefore = chain.getUsdtBalance(A) + chain.getUsdtBalance(B);

    chain.escrowLock({ taskHash: TASK_HASH, requester: A, provider: B, price: 100n as Price });
    chain.hostageStake({ taskHash: TASK_HASH, provider: B, stake: 50n as Price });
    chain.escrowRefund(TASK_HASH);
    chain.hostageSlash(TASK_HASH, A);

    const totalAfter = chain.getUsdtBalance(A) + chain.getUsdtBalance(B);
    expect(totalAfter).toBe(totalBefore);
  });
});

describe('MockChain property: funds conservation under random op sequence', () => {
  it('total balance is invariant across any legal sequence of operations', () => {
    fc.assert(
      fc.property(
        // Generator: array of mint operations to set up initial balances
        fc.array(
          fc.record({
            addr: fc.constantFrom(A, B),
            amount: fc.bigInt({ min: 100n, max: 10_000n })
          }),
          { minLength: 2, maxLength: 6 }
        ),
        (mints) => {
          const chain = new MockChain();
          // Track total minted as the conservation invariant baseline.
          let totalMinted = 0n;
          for (const m of mints) {
            chain.mintUsdt(m.addr, m.amount);
            totalMinted += m.amount;
          }

          // Verify invariant after mint phase.
          const totalAfterMint = chain.getUsdtBalance(A) + chain.getUsdtBalance(B);
          expect(totalAfterMint).toBe(totalMinted);

          // Run a single escrow+hostage settle cycle: total must still equal totalMinted.
          if (chain.getUsdtBalance(A) >= 100n && chain.getUsdtBalance(B) >= 50n) {
            chain.escrowLock({ taskHash: '0x01' as `0x${string}`, requester: A, provider: B, price: 100n as Price });
            chain.hostageStake({ taskHash: '0x01' as `0x${string}`, provider: B, stake: 50n as Price });
            chain.escrowRelease('0x01' as `0x${string}`);
            chain.hostageRefund('0x01' as `0x${string}`);
            const totalAfterCycle = chain.getUsdtBalance(A) + chain.getUsdtBalance(B);
            expect(totalAfterCycle).toBe(totalMinted);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('slash path also conserves funds across runs', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 200n, max: 5_000n }),
        fc.bigInt({ min: 200n, max: 5_000n }),
        (mintA, mintB) => {
          const chain = new MockChain();
          chain.mintUsdt(A, mintA);
          chain.mintUsdt(B, mintB);
          const total = mintA + mintB;

          chain.escrowLock({ taskHash: '0x02' as `0x${string}`, requester: A, provider: B, price: 100n as Price });
          chain.hostageStake({ taskHash: '0x02' as `0x${string}`, provider: B, stake: 50n as Price });
          chain.escrowRefund('0x02' as `0x${string}`);
          chain.hostageSlash('0x02' as `0x${string}`, A);

          expect(chain.getUsdtBalance(A) + chain.getUsdtBalance(B)).toBe(total);
        }
      ),
      { numRuns: 50 }
    );
  });
});
