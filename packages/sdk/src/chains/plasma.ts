import { defineChain } from 'viem';

/// Plasma testnet chain definition for viem.
/// Real chain ID and RPC URLs to be confirmed at Sprint 3 kickoff via ADR-0005 Q1 resolution.
/// Placeholder values are documented but MUST be overridden via env before any real testnet call.
export const plasmaTestnet = defineChain({
  id: Number(process.env.PLASMA_TESTNET_CHAIN_ID ?? 9747),
  name: 'Plasma Testnet',
  nativeCurrency: { name: 'XPL', symbol: 'XPL', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.PLASMA_TESTNET_RPC_URL ?? 'https://testnet-rpc.plasma.to'],
      webSocket: process.env.PLASMA_TESTNET_WS_URL
        ? [process.env.PLASMA_TESTNET_WS_URL]
        : undefined
    }
  },
  blockExplorers: {
    default: {
      name: 'Plasma Explorer',
      url: process.env.PLASMA_TESTNET_EXPLORER_URL ?? 'https://testnet.plasma.to'
    }
  },
  testnet: true
});

/// Known deployed contract addresses on Plasma testnet.
/// Populated by Sprint 3 wave 2 once `script/DeployTestnet.s.sol` runs.
/// All addresses are env-driven so multiple deploys can coexist.
export interface PlasmaDeployment {
  readonly usdt: `0x${string}`;
  readonly escrowVault: `0x${string}`;
  readonly hostageBond: `0x${string}`;
  readonly serviceMarketplace: `0x${string}`;
}

export function readPlasmaDeployment(): PlasmaDeployment {
  const fromEnv = (key: string): `0x${string}` => {
    const value = process.env[key];
    if (!value || !value.startsWith('0x')) {
      throw new Error(`${key} env var missing or not 0x-prefixed`);
    }
    return value as `0x${string}`;
  };
  return {
    usdt: fromEnv('PLASMA_USDT_ADDRESS'),
    escrowVault: fromEnv('PLASMA_ESCROW_VAULT_ADDRESS'),
    hostageBond: fromEnv('PLASMA_HOSTAGE_BOND_ADDRESS'),
    serviceMarketplace: fromEnv('PLASMA_SERVICE_MARKETPLACE_ADDRESS')
  };
}
