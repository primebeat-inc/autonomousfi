import { describe, it, expect } from 'vitest';
import { MockChain, paidAgent, QVACQualityVerifier, StubLLMJudge } from '../src/index.js';
import type { AgentAddress, Price } from '../src/index.js';

const A = '0xA0' as AgentAddress;
const B = '0xB0' as AgentAddress;
const C = '0xC0' as AgentAddress;
const D = '0xD0' as AgentAddress;
const PRICE = 100n as Price;
const STAKE = 50n as Price;

function makeAgent(chain: MockChain, provider: AgentAddress, returnText: string) {
  const judge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.92 }));
  return paidAgent(
    { price: PRICE, stake: STAKE, qualityThreshold: 0.85, deadlineMs: 60_000, providerAddress: provider, chain, judge },
    async () => returnText
  );
}

describe('integration: 3-agent research+draft+review pipeline', () => {
  it('all three providers settle in sequence and A pays them all', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);
    chain.mintUsdt(C, 1_000n);
    chain.mintUsdt(D, 1_000n);

    const research = makeAgent(chain, B, 'research finding X');
    const draft = makeAgent(chain, C, 'draft based on X');
    const review = makeAgent(chain, D, 'reviewed: ok');

    const r1 = await research.call(A, { topic: 'foo' });
    expect(r1.status).toBe('settled');
    const r2 = await draft.call(A, { from: r1.result });
    expect(r2.status).toBe('settled');
    const r3 = await review.call(A, { from: r2.result });
    expect(r3.status).toBe('settled');

    expect(chain.getUsdtBalance(A)).toBe(700n);  // -300
    expect(chain.getUsdtBalance(B)).toBe(1_100n);
    expect(chain.getUsdtBalance(C)).toBe(1_100n);
    expect(chain.getUsdtBalance(D)).toBe(1_100n);
  });

  it('partial failure: middle agent fails, last is never invoked, only first settles', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);
    chain.mintUsdt(C, 1_000n);

    const goodJudge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.92 }));
    const strictJudge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.5 }));  // below 0.85 threshold

    const research = paidAgent(
      { price: PRICE, stake: STAKE, qualityThreshold: 0.85, deadlineMs: 60_000, providerAddress: B, chain, judge: goodJudge },
      async () => 'research ok'
    );
    const draft = paidAgent(
      { price: PRICE, stake: STAKE, qualityThreshold: 0.85, deadlineMs: 60_000, providerAddress: C, chain, judge: strictJudge },
      async () => 'mediocre draft'
    );

    const r1 = await research.call(A, { topic: 'foo' });
    expect(r1.status).toBe('settled');
    const r2 = await draft.call(A, { from: r1.result });
    expect(r2.status).toBe('slashed');

    expect(chain.getUsdtBalance(A)).toBe(950n);  // -100 (paid B) +50 (slashed C's stake)
    expect(chain.getUsdtBalance(B)).toBe(1_100n);
    expect(chain.getUsdtBalance(C)).toBe(950n);  // stake gone
  });
});
