import { AutonomousFiError, ERR_INSUFFICIENT_BALANCE, ERR_ALREADY_RELEASED, ERR_ALREADY_REFUNDED, ERR_UNKNOWN_TASK, ERR_HOSTAGE_ALREADY_RESOLVED } from './errors.js';
import type { AgentAddress, Price } from './types.js';

type EscrowStatus = 'locked' | 'released' | 'refunded';
type HostageStatus = 'staked' | 'refunded' | 'slashed';

interface EscrowRecord {
  requester: AgentAddress;
  provider: AgentAddress;
  price: Price;
  status: EscrowStatus;
}

interface HostageRecord {
  provider: AgentAddress;
  stake: Price;
  status: HostageStatus;
}

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

/**
 * In-memory deterministic chain used by SDK unit tests and the AUTON keynote demo.
 * Real on-chain integration replaces this in Sprint 2-3 (see spec §5.2).
 */
export class MockChain {
  private readonly balances = new Map<AgentAddress, bigint>();
  private readonly escrows = new Map<string, EscrowRecord>();
  private readonly hostages = new Map<string, HostageRecord>();

  getUsdtBalance(addr: AgentAddress): bigint {
    return this.balances.get(addr) ?? 0n;
  }

  mintUsdt(addr: AgentAddress, amount: bigint): void {
    this.balances.set(addr, this.getUsdtBalance(addr) + amount);
  }

  private debit(addr: AgentAddress, amount: bigint): void {
    const current = this.getUsdtBalance(addr);
    if (current < amount) {
      throw new AutonomousFiError(ERR_INSUFFICIENT_BALANCE, `${addr} has ${current}, needs ${amount}`);
    }
    this.balances.set(addr, current - amount);
  }

  private credit(addr: AgentAddress, amount: bigint): void {
    this.balances.set(addr, this.getUsdtBalance(addr) + amount);
  }

  escrowLock(input: EscrowLockInput): void {
    this.debit(input.requester, input.price);
    this.escrows.set(input.taskHash, {
      requester: input.requester,
      provider: input.provider,
      price: input.price,
      status: 'locked'
    });
  }

  escrowRelease(taskHash: `0x${string}`): void {
    const rec = this.escrows.get(taskHash);
    if (!rec) throw new AutonomousFiError(ERR_UNKNOWN_TASK, taskHash);
    if (rec.status === 'released') throw new AutonomousFiError(ERR_ALREADY_RELEASED, taskHash);
    if (rec.status === 'refunded') throw new AutonomousFiError(ERR_ALREADY_REFUNDED, taskHash);
    this.credit(rec.provider, rec.price);
    rec.status = 'released';
  }

  escrowRefund(taskHash: `0x${string}`): void {
    const rec = this.escrows.get(taskHash);
    if (!rec) throw new AutonomousFiError(ERR_UNKNOWN_TASK, taskHash);
    if (rec.status === 'released') throw new AutonomousFiError(ERR_ALREADY_RELEASED, taskHash);
    if (rec.status === 'refunded') throw new AutonomousFiError(ERR_ALREADY_REFUNDED, taskHash);
    this.credit(rec.requester, rec.price);
    rec.status = 'refunded';
  }

  getEscrowStatus(taskHash: `0x${string}`): EscrowStatus | 'unknown' {
    return this.escrows.get(taskHash)?.status ?? 'unknown';
  }

  hostageStake(input: HostageStakeInput): void {
    this.debit(input.provider, input.stake);
    this.hostages.set(input.taskHash, {
      provider: input.provider,
      stake: input.stake,
      status: 'staked'
    });
  }

  hostageRefund(taskHash: `0x${string}`): void {
    const rec = this.hostages.get(taskHash);
    if (!rec) throw new AutonomousFiError(ERR_UNKNOWN_TASK, taskHash);
    if (rec.status !== 'staked') throw new AutonomousFiError(ERR_HOSTAGE_ALREADY_RESOLVED, taskHash);
    this.credit(rec.provider, rec.stake);
    rec.status = 'refunded';
  }

  hostageSlash(taskHash: `0x${string}`, recipient: AgentAddress): void {
    const rec = this.hostages.get(taskHash);
    if (!rec) throw new AutonomousFiError(ERR_UNKNOWN_TASK, taskHash);
    if (rec.status !== 'staked') throw new AutonomousFiError(ERR_HOSTAGE_ALREADY_RESOLVED, taskHash);
    this.credit(recipient, rec.stake);
    rec.status = 'slashed';
  }
}
