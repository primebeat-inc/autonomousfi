import type { Address, PublicClient, WalletClient } from 'viem';
import type { AgentAddress, Price } from '../types.js';
import type { EscrowLockInput, EscrowStatus } from '../chain.js';

export interface ViemEscrowVaultClientConfig {
  readonly publicClient: PublicClient;
  readonly walletClient: WalletClient;
  readonly vaultAddress: `0x${string}`;
}

const ESCROW_ABI = [
  {
    name: 'lock',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'requester', type: 'address' },
      { name: 'provider', type: 'address' },
      { name: 'taskHash', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'release',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskHash', type: 'bytes32' }],
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
    name: 'getStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'taskHash', type: 'bytes32' }],
    outputs: [{ name: '', type: 'uint8' }]
  }
] as const;

const STATUS_MAP: readonly EscrowStatus[] = ['unknown', 'locked', 'released', 'refunded'] as const;

/// viem-backed adapter for EscrowVault. Pairs with HostageBondClient and
/// ServiceMarketplaceClient to fully replace MockChain on Plasma testnet.
/// Sprint 3 wave 1 ships the call surface; wave 2 wires it against the
/// testnet deploy and runs the SDK e2e tests.
export class ViemEscrowVaultClient {
  constructor(private readonly cfg: ViemEscrowVaultClientConfig) {}

  async lock(input: EscrowLockInput, deadline: bigint, requesterAccount: Address): Promise<`0x${string}`> {
    return this.cfg.walletClient.writeContract({
      account: requesterAccount,
      address: this.cfg.vaultAddress,
      abi: ESCROW_ABI,
      functionName: 'lock',
      args: [input.requester, input.provider, input.taskHash, input.price, deadline],
      chain: this.cfg.walletClient.chain ?? null
    });
  }

  async release(taskHash: `0x${string}`, operatorAccount: Address): Promise<`0x${string}`> {
    return this.cfg.walletClient.writeContract({
      account: operatorAccount,
      address: this.cfg.vaultAddress,
      abi: ESCROW_ABI,
      functionName: 'release',
      args: [taskHash],
      chain: this.cfg.walletClient.chain ?? null
    });
  }

  async refund(taskHash: `0x${string}`, account: Address): Promise<`0x${string}`> {
    return this.cfg.walletClient.writeContract({
      account,
      address: this.cfg.vaultAddress,
      abi: ESCROW_ABI,
      functionName: 'refund',
      args: [taskHash],
      chain: this.cfg.walletClient.chain ?? null
    });
  }

  async getStatus(taskHash: `0x${string}`): Promise<EscrowStatus> {
    const raw = await this.cfg.publicClient.readContract({
      address: this.cfg.vaultAddress,
      abi: ESCROW_ABI,
      functionName: 'getStatus',
      args: [taskHash]
    });
    return STATUS_MAP[Number(raw)] ?? 'unknown';
  }
}
