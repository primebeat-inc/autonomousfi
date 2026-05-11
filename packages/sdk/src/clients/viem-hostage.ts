import type { Address, PublicClient, WalletClient } from 'viem';
import type { AgentAddress, Price } from '../types.js';
import type { HostageStakeInput, HostageStatus } from '../chain.js';

export interface ViemHostageBondClientConfig {
  readonly publicClient: PublicClient;
  readonly walletClient: WalletClient;
  readonly bondAddress: `0x${string}`;
}

const HOSTAGE_ABI = [
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskHash', type: 'bytes32' },
      { name: 'provider', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'refund',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskHash', type: 'bytes32' }],
    outputs: []
  },
  {
    name: 'slash',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskHash', type: 'bytes32' },
      { name: 'recipient', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'getStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'taskHash', type: 'bytes32' }],
    outputs: [{ name: '', type: 'uint8' }]
  }
] as const;

const STATUS_MAP: readonly HostageStatus[] = ['unknown', 'staked', 'refunded', 'slashed'] as const;

export class ViemHostageBondClient {
  constructor(private readonly cfg: ViemHostageBondClientConfig) {}

  async stake(input: HostageStakeInput, operatorAccount: Address): Promise<`0x${string}`> {
    return this.cfg.walletClient.writeContract({
      account: operatorAccount,
      address: this.cfg.bondAddress,
      abi: HOSTAGE_ABI,
      functionName: 'stake',
      args: [input.taskHash, input.provider, input.stake],
      chain: this.cfg.walletClient.chain ?? null
    });
  }

  async refund(taskHash: `0x${string}`, operatorAccount: Address): Promise<`0x${string}`> {
    return this.cfg.walletClient.writeContract({
      account: operatorAccount,
      address: this.cfg.bondAddress,
      abi: HOSTAGE_ABI,
      functionName: 'refund',
      args: [taskHash],
      chain: this.cfg.walletClient.chain ?? null
    });
  }

  async slash(taskHash: `0x${string}`, recipient: AgentAddress, operatorAccount: Address): Promise<`0x${string}`> {
    return this.cfg.walletClient.writeContract({
      account: operatorAccount,
      address: this.cfg.bondAddress,
      abi: HOSTAGE_ABI,
      functionName: 'slash',
      args: [taskHash, recipient],
      chain: this.cfg.walletClient.chain ?? null
    });
  }

  async getStatus(taskHash: `0x${string}`): Promise<HostageStatus> {
    const raw = await this.cfg.publicClient.readContract({
      address: this.cfg.bondAddress,
      abi: HOSTAGE_ABI,
      functionName: 'getStatus',
      args: [taskHash]
    });
    return STATUS_MAP[Number(raw)] ?? 'unknown';
  }
}
