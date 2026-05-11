import type { TaskSpec } from './types.js';

/**
 * Sprint 1 stub. Sprint 5 swaps this for a real QVAC-driven local LLM judge
 * (Llama 3.1 8B Instruct baseline, see spec §5.1).
 */
export interface QualityJudge {
  judge(spec: TaskSpec, result: string): Promise<number>; // returns score in [0,1]
}

export interface StubLLMJudgeOptions {
  readonly matchScore: number;
  readonly failOn?: string;
}

export class StubLLMJudge implements QualityJudge {
  constructor(private readonly opts: StubLLMJudgeOptions) {}

  async judge(_spec: TaskSpec, result: string): Promise<number> {
    if (this.opts.failOn !== undefined && result.includes(this.opts.failOn)) {
      return 0.1;
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
