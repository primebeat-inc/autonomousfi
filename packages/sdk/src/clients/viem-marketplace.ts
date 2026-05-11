import type { Address, PublicClient, WalletClient } from 'viem';

export interface ViemServiceMarketplaceClientConfig {
  readonly publicClient: PublicClient;
  readonly walletClient: WalletClient;
  readonly marketplaceAddress: `0x${string}`;
}

export type TaskStatus = 'unknown' | 'created' | 'submitted' | 'settled' | 'slashed' | 'disputed';

const STATUS_MAP: readonly TaskStatus[] = ['unknown', 'created', 'submitted', 'settled', 'slashed', 'disputed'];

const MARKETPLACE_ABI = [
  {
    name: 'createTask',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'provider', type: 'address' },
      { name: 'taskHash', type: 'bytes32' },
      { name: 'price', type: 'uint256' },
      { name: 'stake', type: 'uint256' },
      { name: 'qualityHash', type: 'bytes32' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'submitResult',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskHash', type: 'bytes32' },
      { name: 'resultHash', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    name: 'settle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskHash', type: 'bytes32' }],
    outputs: []
  },
  {
    name: 'dispute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskHash', type: 'bytes32' },
      { name: 'reason', type: 'string' }
    ],
    outputs: []
  },
  {
    name: 'resolveDispute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'taskHash', type: 'bytes32' },
      { name: 'inFavorOfRequester', type: 'bool' }
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

export interface CreateTaskParams {
  provider: `0x${string}`;
  taskHash: `0x${string}`;
  price: bigint;
  stake: bigint;
  qualityHash: `0x${string}`;
  deadline: bigint;
}

export class ViemServiceMarketplaceClient {
  constructor(private readonly cfg: ViemServiceMarketplaceClientConfig) {}

  async createTask(params: CreateTaskParams, requesterAccount: Address): Promise<`0x${string}`> {
    return this.cfg.walletClient.writeContract({
      account: requesterAccount,
      address: this.cfg.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'createTask',
      args: [params.provider, params.taskHash, params.price, params.stake, params.qualityHash, params.deadline],
      chain: this.cfg.walletClient.chain ?? null
    });
  }

  async submitResult(taskHash: `0x${string}`, resultHash: `0x${string}`, providerAccount: Address): Promise<`0x${string}`> {
    return this.cfg.walletClient.writeContract({
      account: providerAccount,
      address: this.cfg.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'submitResult',
      args: [taskHash, resultHash],
      chain: this.cfg.walletClient.chain ?? null
    });
  }

  async settle(taskHash: `0x${string}`, requesterAccount: Address): Promise<`0x${string}`> {
    return this.cfg.walletClient.writeContract({
      account: requesterAccount,
      address: this.cfg.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'settle',
      args: [taskHash],
      chain: this.cfg.walletClient.chain ?? null
    });
  }

  async dispute(taskHash: `0x${string}`, reason: string, requesterAccount: Address): Promise<`0x${string}`> {
    return this.cfg.walletClient.writeContract({
      account: requesterAccount,
      address: this.cfg.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'dispute',
      args: [taskHash, reason],
      chain: this.cfg.walletClient.chain ?? null
    });
  }

  async resolveDispute(taskHash: `0x${string}`, inFavorOfRequester: boolean, adminAccount: Address): Promise<`0x${string}`> {
    return this.cfg.walletClient.writeContract({
      account: adminAccount,
      address: this.cfg.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'resolveDispute',
      args: [taskHash, inFavorOfRequester],
      chain: this.cfg.walletClient.chain ?? null
    });
  }

  async getStatus(taskHash: `0x${string}`): Promise<TaskStatus> {
    const raw = await this.cfg.publicClient.readContract({
      address: this.cfg.marketplaceAddress,
      abi: MARKETPLACE_ABI,
      functionName: 'getStatus',
      args: [taskHash]
    });
    return STATUS_MAP[Number(raw)] ?? 'unknown';
  }
}
