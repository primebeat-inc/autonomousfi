import type { AgentAddress, Price } from './types.js';

export type EscrowStatus = 'locked' | 'released' | 'refunded' | 'unknown';
export type HostageStatus = 'staked' | 'refunded' | 'slashed' | 'unknown';

export interface EscrowLockInput {
  taskHash: `0x${string}`;
  requester: AgentAddress;
  provider: AgentAddress;
  price: Price;
}

export interface HostageStakeInput {
  taskHash: `0x${string}`;
  provider: AgentAddress;
  stake: Price;
}

/// Interface implemented by both MockChain (in-memory) and the viem-backed adapter.
export interface ChainAdapter {
  getUsdtBalance(addr: AgentAddress): bigint | Promise<bigint>;
  escrowLock(input: EscrowLockInput): void | Promise<void>;
  escrowRelease(taskHash: `0x${string}`): void | Promise<void>;
  escrowRefund(taskHash: `0x${string}`): void | Promise<void>;
  getEscrowStatus(taskHash: `0x${string}`): EscrowStatus | Promise<EscrowStatus>;
  hostageStake(input: HostageStakeInput): void | Promise<void>;
  hostageRefund(taskHash: `0x${string}`): void | Promise<void>;
  hostageSlash(taskHash: `0x${string}`, recipient: AgentAddress): void | Promise<void>;
}
