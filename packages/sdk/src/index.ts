export { MockChain } from './mock-chain.js';
export { paidAgent, type PaidAgentOutcome, type PaidAgentHandle, type PaidAgentOptions } from './paid-agent.js';
export { QVACQualityVerifier, StubLLMJudge, type QualityJudge } from './quality.js';
export {
  scoreToScaled,
  scaledToScore,
  isValidPrice,
  asAgentAddress,
  asTaskId,
  asPrice,
  SCORE_SCALE,
  MAX_U64,
  type TaskId,
  type AgentAddress,
  type Price,
  type TaskSpec,
  type TaskCompletion,
  type PaidAgentConfig
} from './types.js';
export { AutonomousFiError } from './errors.js';

export const SDK_VERSION = '0.0.1';
