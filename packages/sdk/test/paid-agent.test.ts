import { describe, it, expect } from 'vitest';
import { MockChain } from '../src/mock-chain.js';
import { paidAgent } from '../src/paid-agent.js';
import { QVACQualityVerifier, StubLLMJudge } from '../src/quality.js';
import type { AgentAddress, Price } from '../src/types.js';

const A: AgentAddress = '0xAAAA' as AgentAddress;
const B: AgentAddress = '0xBBBB' as AgentAddress;
const C: AgentAddress = '0xCCCC' as AgentAddress;

function makeOpts(chain: MockChain, judge: QVACQualityVerifier, provider: AgentAddress = B) {
  return {
    price: 100n as Price,
    stake: 50n as Price,
    qualityThreshold: 0.85,
    deadlineMs: 60_000,
    providerAddress: provider,
    chain,
    judge
  };
}

describe('paidAgent throw safety', () => {
  it('refunds escrow and slashes hostage if impl throws', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);
    const judge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.9 }));

    const handle = paidAgent(makeOpts(chain, judge), async () => {
      throw new Error('impl crashed');
    });

    await expect(handle.call(A, { x: 1 })).rejects.toThrow('impl crashed');
    // A gets escrow refund + hostage slash = back to 1000 + 50
    expect(chain.getUsdtBalance(A)).toBe(1_050n);
    // B lost the stake
    expect(chain.getUsdtBalance(B)).toBe(950n);
  });

  it('refunds escrow and slashes hostage if judge throws', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);
    const explosiveJudge = new QVACQualityVerifier({
      async judge() { throw new Error('judge broke'); }
    });

    const handle = paidAgent(makeOpts(chain, explosiveJudge), async () => 'fine result');

    await expect(handle.call(A, { x: 1 })).rejects.toThrow('judge broke');
    expect(chain.getUsdtBalance(A)).toBe(1_050n);
    expect(chain.getUsdtBalance(B)).toBe(950n);
  });

  it('does NOT leak escrow when escrowLock itself throws (no cleanup needed)', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 50n); // less than price=100
    chain.mintUsdt(B, 1_000n);
    const judge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.9 }));

    const handle = paidAgent(makeOpts(chain, judge), async () => 'never reached');

    await expect(handle.call(A, { x: 1 })).rejects.toThrow(/insufficient balance/);
    // No state change: lock failed before any debit
    expect(chain.getUsdtBalance(A)).toBe(50n);
    expect(chain.getUsdtBalance(B)).toBe(1_000n);
  });
});

describe('paidAgent task isolation across calls', () => {
  it('issues distinct taskHashes for back-to-back calls on the same handle', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);
    const judge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.9 }));
    const handle = paidAgent(makeOpts(chain, judge), async () => 'ok');

    const out1 = await handle.call(A, { run: 1 });
    const out2 = await handle.call(A, { run: 2 });
    // Both settle and balances accumulate correctly = no collision
    expect(out1.status).toBe('settled');
    expect(out2.status).toBe('settled');
    expect(chain.getUsdtBalance(A)).toBe(800n);  // -100 * 2
    expect(chain.getUsdtBalance(B)).toBe(1_200n); // +100 * 2
  });

  it('isolates taskCounter between distinct paidAgent handles in same process', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 500n);
    chain.mintUsdt(C, 500n);
    const judge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.9 }));

    const handleB = paidAgent(makeOpts(chain, judge, B), async () => 'from B');
    const handleC = paidAgent(makeOpts(chain, judge, C), async () => 'from C');

    // First call on each handle should not collide.
    // (If counter were module-global the second handle's first call would
    // use a counter value already used by the first handle.)
    const outB = await handleB.call(A, { svc: 'b' });
    const outC = await handleC.call(A, { svc: 'c' });
    expect(outB.status).toBe('settled');
    expect(outC.status).toBe('settled');
  });
});

describe('paidAgent threshold boundary', () => {
  it('settles exactly at qualityThreshold (>= is inclusive)', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);
    const judge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.85 }));
    const handle = paidAgent(makeOpts(chain, judge), async () => 'borderline');

    const out = await handle.call(A, { x: 1 });
    expect(out.status).toBe('settled');
    expect(out.score).toBe(0.85);
  });

  it('slashes just below qualityThreshold', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);
    const judge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.849 }));
    const handle = paidAgent(makeOpts(chain, judge), async () => 'just under');

    const out = await handle.call(A, { x: 1 });
    expect(out.status).toBe('slashed');
    expect(out.score).toBe(0.849);
  });
});
