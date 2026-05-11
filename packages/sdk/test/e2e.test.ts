import { describe, it, expect } from 'vitest';
import { MockChain } from '../src/mock-chain.js';
import { paidAgent } from '../src/paid-agent.js';
import { QVACQualityVerifier, StubLLMJudge } from '../src/quality.js';
import type { AgentAddress, Price } from '../src/types.js';

const A: AgentAddress = '0xAAAA' as AgentAddress;
const B: AgentAddress = '0xBBBB' as AgentAddress;

describe('e2e: requester pays provider through @paid_agent', () => {
  it('settles successfully when QVAC judge approves', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);

    const judge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.92 }));

    const reviewCode = paidAgent(
      {
        price: 100n as Price,
        stake: 50n as Price,
        qualityThreshold: 0.85,
        deadlineMs: 60_000,
        providerAddress: B,
        chain,
        judge
      },
      async (snippet: string) => `Reviewed: ${snippet} — looks good`
    );

    const out = await reviewCode.call(A, { snippet: 'function add(a,b){return a+b}' });

    expect(out.status).toBe('settled');
    expect(out.score).toBeGreaterThanOrEqual(0.85);
    expect(chain.getUsdtBalance(A)).toBe(900n);
    expect(chain.getUsdtBalance(B)).toBe(1_100n);
  });

  it('slashes provider when judge fails', async () => {
    const chain = new MockChain();
    chain.mintUsdt(A, 1_000n);
    chain.mintUsdt(B, 1_000n);

    const judge = new QVACQualityVerifier(
      new StubLLMJudge({ matchScore: 0.9, failOn: 'TERRIBLE' })
    );

    const reviewCode = paidAgent(
      {
        price: 100n as Price,
        stake: 50n as Price,
        qualityThreshold: 0.85,
        deadlineMs: 60_000,
        providerAddress: B,
        chain,
        judge
      },
      async () => 'TERRIBLE OUTPUT'
    );

    const out = await reviewCode.call(A, { snippet: 'whatever' });

    expect(out.status).toBe('slashed');
    expect(chain.getUsdtBalance(A)).toBe(1_050n); // refund 100 + hostage slash 50 minus original lock
    expect(chain.getUsdtBalance(B)).toBe(950n);   // stake gone
  });
});
