import { describe, it, expect } from 'vitest';
import { createPublicClient, createWalletClient, http, privateKeyToAccount } from 'viem';
import type { Address } from 'viem';
import { ViemChainAdapter } from '../src/clients/viem-adapter.js';
import { plasmaTestnet, readPlasmaDeployment } from '../src/chains/plasma.js';
import { paidAgent } from '../src/paid-agent.js';
import { QVACQualityVerifier, StubLLMJudge } from '../src/quality.js';
import type { AgentAddress, Price } from '../src/types.js';

// Gate on env: skip the whole suite unless a Plasma testnet private key is present.
const PRIVATE_KEY = process.env.PLASMA_TESTNET_PRIVATE_KEY as `0x${string}` | undefined;

(PRIVATE_KEY ? describe : describe.skip)('e2e against Plasma testnet', () => {
  it('full settle cycle: createTask -> submitResult -> settle', async () => {
    const account = privateKeyToAccount(PRIVATE_KEY!);
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
        deadlineMs: 600_000,
        providerAddress: provider,
        chain,
        judge,
      },
      async () => 'testnet ok',
    );

    const out = await handle.call(account.address as unknown as AgentAddress, { input: 'testnet' });
    expect(out.status).toBe('settled');
    expect(out.score).toBeGreaterThanOrEqual(0.85);
  }, 60_000);
});
