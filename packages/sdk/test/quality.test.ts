import { describe, it, expect } from 'vitest';
import { QVACQualityVerifier, StubLLMJudge } from '../src/quality.js';
import { scoreToScaled } from '../src/types.js';

describe('QVACQualityVerifier with StubLLMJudge', () => {
  it('returns a high score when result matches expected', async () => {
    const verifier = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.95 }));
    const score = await verifier.evaluate(
      { taskHash: '0xabc', description: 'review this code', inputs: {} },
      'looks good'
    );
    expect(scoreToScaled(score)).toBe(950_000);
  });

  it('returns a low score for the explicit failure marker', async () => {
    const verifier = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.95, failOn: 'BAD' }));
    const score = await verifier.evaluate(
      { taskHash: '0xabc', description: 'review this code', inputs: {} },
      'BAD'
    );
    expect(score).toBeLessThan(0.5);
  });
});
