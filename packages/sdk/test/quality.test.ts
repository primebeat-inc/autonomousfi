import { describe, it, expect } from 'vitest';
import { QVACQualityVerifier, StubLLMJudge, STUB_FAILURE_SCORE } from '../src/quality.js';
import { scoreToScaled, type TaskSpec } from '../src/types.js';

const SPEC: TaskSpec = { taskHash: '0xabc', description: 'review this code', inputs: {} };

describe('QVACQualityVerifier with StubLLMJudge', () => {
  it('returns a high score when result matches expected', async () => {
    const verifier = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.95 }));
    const score = await verifier.evaluate(SPEC, 'looks good');
    expect(scoreToScaled(score)).toBe(950_000);
  });

  it('returns a low score for the explicit failure marker', async () => {
    const verifier = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.95, failOn: 'BAD' }));
    const score = await verifier.evaluate(SPEC, 'BAD');
    expect(score).toBeLessThan(0.5);
  });
});

describe('StubLLMJudge edge cases', () => {
  it('returns STUB_FAILURE_SCORE for the failure path', async () => {
    const verifier = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.9, failOn: 'X' }));
    const score = await verifier.evaluate(SPEC, 'contains X marker');
    expect(score).toBe(STUB_FAILURE_SCORE);
  });

  it('exports STUB_FAILURE_SCORE constant for downstream test parity', () => {
    expect(STUB_FAILURE_SCORE).toBe(0.1);
  });

  it('matches failOn as substring, not equality', async () => {
    const verifier = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.9, failOn: 'fail' }));
    const score = await verifier.evaluate(SPEC, 'task did fail at step 3');
    expect(score).toBe(STUB_FAILURE_SCORE);
  });

  it('does NOT fail when failOn marker is absent', async () => {
    const verifier = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.88, failOn: 'X' }));
    const score = await verifier.evaluate(SPEC, 'all good here');
    expect(score).toBe(0.88);
  });

  it('rejects empty failOn at construction (would otherwise match every result)', () => {
    expect(() => new StubLLMJudge({ matchScore: 0.9, failOn: '' })).toThrow(/non-empty string/);
  });

  it('omitted failOn never triggers failure path', async () => {
    const verifier = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.7 }));
    const score = await verifier.evaluate(SPEC, '');
    expect(score).toBe(0.7);
  });

  it('matchScore of 0 returns 0 (boundary)', async () => {
    const verifier = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0 }));
    expect(await verifier.evaluate(SPEC, 'anything')).toBe(0);
  });

  it('matchScore of 1 returns 1 (boundary)', async () => {
    const verifier = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 1 }));
    expect(await verifier.evaluate(SPEC, 'anything')).toBe(1);
  });
});
