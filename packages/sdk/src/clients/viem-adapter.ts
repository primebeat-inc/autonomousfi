import type { Address, PublicClient, WalletClient } from 'viem';
import type { AgentAddress, Price } from '../types.js';
import type {
  ChainAdapter,
  EscrowLockInput,
  EscrowStatus,
  HostageStakeInput,
  HostageStatus
} from '../chain.js';
import { ViemEscrowVaultClient } from './viem-escrow.js';
import { ViemHostageBondClient } from './viem-hostage.js';

export interface ViemChainAdapterConfig {
  readonly publicClient: PublicClient;
  readonly walletClient: WalletClient;
  readonly escrowVaultAddress: `0x${string}`;
  readonly hostageBondAddress: `0x${string}`;
  readonly operatorAccount: Address;
  /// Deadline (in seconds from now) applied to all escrowLock calls. Default 1 day.
  readonly defaultDeadlineSeconds?: number;
}

/// Aggregates the three leaf viem clients into a single ChainAdapter
/// implementation. Pairs with `paidAgent({ ..., chain: new ViemChainAdapter(...) })`.
export class ViemChainAdapter implements ChainAdapter {
  private readonly escrow: ViemEscrowVaultClient;
  private readonly hostage: ViemHostageBondClient;
  private readonly cfg: ViemChainAdapterConfig;
  private readonly defaultDeadline: bigint;

  constructor(cfg: ViemChainAdapterConfig) {
    this.cfg = cfg;
    this.escrow = new ViemEscrowVaultClient({
      publicClient: cfg.publicClient,
      walletClient: cfg.walletClient,
      vaultAddress: cfg.escrowVaultAddress
    });
    this.hostage = new ViemHostageBondClient({
      publicClient: cfg.publicClient,
      walletClient: cfg.walletClient,
      bondAddress: cfg.hostageBondAddress
    });
    this.defaultDeadline = BigInt(cfg.defaultDeadlineSeconds ?? 86400);
  }

  async getUsdtBalance(_addr: AgentAddress): Promise<bigint> {
    // Sprint 3 wave 2 wires the ERC20 balanceOf call against the USDT token.
    // For wave 1 we throw; callers should not depend on this until wave 2.
    throw new Error('ViemChainAdapter.getUsdtBalance not yet wired; Sprint 3 wave 2 adds USDT ABI');
  }

  async escrowLock(input: EscrowLockInput): Promise<void> {
    const deadline = BigInt(Math.floor(Date.now() / 1000)) + this.defaultDeadline;
    await this.escrow.lock(input, deadline, this.cfg.operatorAccount);
  }

  async escrowRelease(taskHash: `0x${string}`): Promise<void> {
    await this.escrow.release(taskHash, this.cfg.operatorAccount);
  }

  async escrowRefund(taskHash: `0x${string}`): Promise<void> {
    await this.escrow.refund(taskHash, this.cfg.operatorAccount);
  }

  async getEscrowStatus(taskHash: `0x${string}`): Promise<EscrowStatus> {
    return this.escrow.getStatus(taskHash);
  }

  async hostageStake(input: HostageStakeInput): Promise<void> {
    await this.hostage.stake(input, this.cfg.operatorAccount);
  }

  async hostageRefund(taskHash: `0x${string}`): Promise<void> {
    await this.hostage.refund(taskHash, this.cfg.operatorAccount);
  }

  async hostageSlash(taskHash: `0x${string}`, recipient: AgentAddress): Promise<void> {
    await this.hostage.slash(taskHash, recipient, this.cfg.operatorAccount);
  }
}
