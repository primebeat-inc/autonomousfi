import type { MockChain } from './mock-chain.js';
import type { QVACQualityVerifier } from './quality.js';
import type { AgentAddress, Price, TaskSpec } from './types.js';

export interface PaidAgentOptions {
  readonly price: Price;
  readonly stake: Price;
  readonly qualityThreshold: number;
  readonly deadlineMs: number;
  readonly providerAddress: AgentAddress;
  readonly chain: MockChain;
  readonly judge: QVACQualityVerifier;
}

export type PaidAgentOutcome =
  | { status: 'settled'; result: string; score: number }
  | { status: 'slashed'; result: string; score: number };

export interface PaidAgentHandle<TInput> {
  call(requester: AgentAddress, input: TInput): Promise<PaidAgentOutcome>;
}

let taskCounter = 0;
function nextTaskHash(): `0x${string}` {
  taskCounter += 1;
  return `0x${taskCounter.toString(16).padStart(8, '0')}` as `0x${string}`;
}

export function paidAgent<TInput extends Record<string, unknown>>(
  opts: PaidAgentOptions,
  impl: (...args: unknown[]) => Promise<string>
): PaidAgentHandle<TInput> {
  return {
    async call(requester: AgentAddress, input: TInput): Promise<PaidAgentOutcome> {
      const taskHash = nextTaskHash();
      const spec: TaskSpec = {
        taskHash,
        description: `paid_agent invocation #${taskCounter}`,
        inputs: input
      };

      opts.chain.escrowLock({
        taskHash,
        requester,
        provider: opts.providerAddress,
        price: opts.price
      });
      opts.chain.hostageStake({
        taskHash,
        provider: opts.providerAddress,
        stake: opts.stake
      });

      try {
        const args = Object.values(input);
        const result = await impl(...args);
        const score = await opts.judge.evaluate(spec, result);

        if (score >= opts.qualityThreshold) {
          opts.chain.escrowRelease(taskHash);
          opts.chain.hostageRefund(taskHash);
          return { status: 'settled', result, score };
        } else {
          opts.chain.escrowRefund(taskHash);
          opts.chain.hostageSlash(taskHash, requester);
          return { status: 'slashed', result, score };
        }
      } catch (e) {
        // impl or judge.evaluate threw: cleanup partial state to prevent escrow leak.
        // Provider gets slashed (responsibility for crashed code); requester gets refund.
        // Each cleanup is independently guarded so a double-slash on retry surfaces a clear error rather than silently corrupting state.
        try { opts.chain.escrowRefund(taskHash); } catch { /* already resolved */ }
        try { opts.chain.hostageSlash(taskHash, requester); } catch { /* already resolved */ }
        throw e;
      }
    }
  };
}
