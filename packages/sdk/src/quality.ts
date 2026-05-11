import type { TaskSpec } from './types.js';

/**
 * Sprint 1 stub. Sprint 5 swaps this for a real QVAC-driven local LLM judge
 * (Llama 3.1 8B Instruct baseline, see spec §5.1).
 */
export interface QualityJudge {
  judge(spec: TaskSpec, result: string): Promise<number>; // returns score in [0,1]
}

/** Score returned by the stub judge when the failure marker is hit. */
export const STUB_FAILURE_SCORE = 0.1;

export interface StubLLMJudgeOptions {
  readonly matchScore: number;
  /** Substring marker that, when present in the result, forces a failure score. Empty string is forbidden. */
  readonly failOn?: string;
}

export class StubLLMJudge implements QualityJudge {
  constructor(private readonly opts: StubLLMJudgeOptions) {
    if (opts.failOn !== undefined && opts.failOn.length === 0) {
      throw new Error('StubLLMJudge: failOn must be a non-empty string when provided');
    }
  }

  async judge(_spec: TaskSpec, result: string): Promise<number> {
    if (this.opts.failOn !== undefined && result.includes(this.opts.failOn)) {
      return STUB_FAILURE_SCORE;
    }
    return this.opts.matchScore;
  }
}

export class QVACQualityVerifier {
  constructor(private readonly judge: QualityJudge) {}

  async evaluate(spec: TaskSpec, result: string): Promise<number> {
    return this.judge.judge(spec, result);
  }
}
