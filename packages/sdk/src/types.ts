/**
 * Shared types for the AutonomousFi SDK.
 *
 * The score fixed-point scale (1e6) matches the binding decision in
 * spec §7.1 to keep TypeScript SDK and Risc0 guest program in sync.
 */

export type TaskId = string & { readonly __brand: 'TaskId' };
export type AgentAddress = `0x${string}` & { readonly __brand: 'AgentAddress' };
export type Price = bigint & { readonly __brand: 'Price' };

export const SCORE_SCALE = 1_000_000;
const MAX_U64 = 2n ** 64n - 1n;

export function scoreToScaled(score: number): number {
  if (score >= 1) return SCORE_SCALE;
  if (score <= 0) return 0;
  return Math.round(score * SCORE_SCALE);
}

export function scaledToScore(scaled: number): number {
  return scaled / SCORE_SCALE;
}

export function isValidPrice(price: bigint): boolean {
  return price > 0n && price <= MAX_U64;
}

export interface TaskSpec {
  readonly taskHash: `0x${string}`;
  readonly description: string;
  readonly inputs: Record<string, unknown>;
}

export interface TaskCompletion {
  readonly taskHash: `0x${string}`;
  readonly providerAddress: AgentAddress;
  readonly requesterAddress: AgentAddress;
  readonly scoreScaled: number;
  readonly counterpartySig: `0x${string}`;
}

export interface PaidAgentConfig {
  readonly price: Price;
  readonly stake: Price;
  readonly qualityThreshold: number;
  readonly deadlineMs: number;
}
