#!/usr/bin/env tsx
/**
 * Latency benchmark: time createTask -> submitResult -> settle against Plasma testnet.
 * Target per Sprint 3 design: <3 seconds wall clock (vs Sprint 1's 5.7s subprocess).
 *
 * Usage:
 *   PLASMA_TESTNET_PRIVATE_KEY=0x... \
 *   PLASMA_USDT_ADDRESS=0x... \
 *   PLASMA_ESCROW_VAULT_ADDRESS=0x... \
 *   PLASMA_HOSTAGE_BOND_ADDRESS=0x... \
 *   PLASMA_SERVICE_MARKETPLACE_ADDRESS=0x... \
 *   tsx packages/sdk/scripts/bench-e2e.ts
 */
import { createPublicClient, createWalletClient, http, privateKeyToAccount } from 'viem';
import { ViemChainAdapter } from '../src/clients/viem-adapter.js';
import { plasmaTestnet, readPlasmaDeployment } from '../src/chains/plasma.js';
import { paidAgent } from '../src/paid-agent.js';
import { QVACQualityVerifier, StubLLMJudge } from '../src/quality.js';
import type { AgentAddress, Price } from '../src/types.js';

async function main() {
  const pk = process.env.PLASMA_TESTNET_PRIVATE_KEY;
  if (!pk) {
    console.error('PLASMA_TESTNET_PRIVATE_KEY env required');
    process.exit(1);
  }
  const account = privateKeyToAccount(pk as `0x${string}`);
  const publicClient = createPublicClient({ chain: plasmaTestnet, transport: http() });
  const walletClient = createWalletClient({ chain: plasmaTestnet, transport: http(), account });
  const deployment = readPlasmaDeployment();

  const chain = new ViemChainAdapter({
    publicClient,
    walletClient,
    escrowVaultAddress: deployment.escrowVault,
    hostageBondAddress: deployment.hostageBond,
    operatorAccount: account.address,
    defaultDeadlineSeconds: 600,
  });

  const judge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.92 }));
  const provider = account.address as unknown as AgentAddress;

  const handle = paidAgent(
    {
      price: 100n as Price,
      stake: 50n as Price,
      qualityThreshold: 0.85,
      deadlineMs: 60_000,
      providerAddress: provider,
      chain,
      judge,
    },
    async () => 'bench result',
  );

  const start = performance.now();
  const out = await handle.call(account.address as unknown as AgentAddress, { input: 'bench' });
  const elapsedMs = performance.now() - start;

  console.log(JSON.stringify({
    status: out.status,
    score: out.score,
    elapsed_ms: Math.round(elapsedMs),
    target_ms: 3000,
    passed: elapsedMs < 3000,
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
