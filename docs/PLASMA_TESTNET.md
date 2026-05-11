# Plasma Testnet — Developer Guide

This document is the single source of truth for connecting AutonomousFi components to
the Plasma testnet. All chain configuration is centralized in
`@autonomousfi/sdk` via `plasmaTestnet` (a viem `Chain`) and `readPlasmaDeployment()`.

Per ADR-0005, the default RPC endpoint is the official Tether-operated endpoint
(`https://testnet-rpc.plasma.to`). Operators MAY override every value via environment
variables — the SDK never hard-codes anything that cannot be replaced at runtime.

## Connecting via viem

```ts
import { createPublicClient, http } from 'viem';
import { plasmaTestnet, readPlasmaDeployment } from '@autonomousfi/sdk';

const client = createPublicClient({
  chain: plasmaTestnet,
  transport: http() // uses plasmaTestnet.rpcUrls.default.http[0]
});

const blockNumber = await client.getBlockNumber();
console.log(`Connected to ${plasmaTestnet.name} (chainId=${plasmaTestnet.id})`);
console.log(`Latest block: ${blockNumber}`);

// Load deployed contract addresses (throws if env vars are missing or malformed).
const deployment = readPlasmaDeployment();
console.log(`Escrow vault: ${deployment.escrowVault}`);
```

A wallet client wired to a local key looks the same:

```ts
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(process.env.OPERATOR_PRIVATE_KEY as `0x${string}`);
const wallet = createWalletClient({ account, chain: plasmaTestnet, transport: http() });
```

## Required environment variables

### Chain configuration (all optional — defaults shown)

| Variable                       | Default                              | Purpose                                |
| ------------------------------ | ------------------------------------ | -------------------------------------- |
| `PLASMA_TESTNET_CHAIN_ID`      | `9747`                               | Override chain id (placeholder pending ADR-0005 Q1) |
| `PLASMA_TESTNET_RPC_URL`       | `https://testnet-rpc.plasma.to`      | Primary HTTP RPC                       |
| `PLASMA_TESTNET_WS_URL`        | _(unset)_                            | Optional WebSocket endpoint            |
| `PLASMA_TESTNET_EXPLORER_URL`  | `https://testnet.plasma.to`          | Block explorer base URL                |

Default values are placeholders until ADR-0005 Q1 (chain id confirmation) is
resolved. Override them in any production-like context.

### Deployment addresses (REQUIRED — no defaults)

`readPlasmaDeployment()` throws if any of these are missing or do not begin with `0x`:

| Variable                                   | Contract             |
| ------------------------------------------ | -------------------- |
| `PLASMA_USDT_ADDRESS`                      | USDT (Tether) on Plasma |
| `PLASMA_ESCROW_VAULT_ADDRESS`              | `EscrowVault`        |
| `PLASMA_HOSTAGE_BOND_ADDRESS`              | `HostageBond`        |
| `PLASMA_SERVICE_MARKETPLACE_ADDRESS`       | `ServiceMarketplace` |

These values are populated by Sprint 3 wave 2 after `script/DeployTestnet.s.sol`
runs. Until then, integration tests should stub addresses or use the in-process
`MockChain`.

## Fallback RPC

If `https://testnet-rpc.plasma.to` is unavailable, point `PLASMA_TESTNET_RPC_URL`
at the community fallback endpoint to be confirmed at Sprint 3 kickoff (tracked in
ADR-0005). Operators are encouraged to run their own RPC node for production
workloads — the SDK does not depend on any specific provider.

## Faucet

> Faucet URL: _to be confirmed at Sprint 3 kickoff (ADR-0005 Q3)._

Until the official faucet is published, contact the Plasma team directly for
testnet XPL and testnet USDT.

## Verifying a deployment matches the expected ABI

Before trusting addresses returned from `readPlasmaDeployment()`, confirm each
deployment exposes the function selectors your code calls. A minimal check:

```ts
import { getContract } from 'viem';
import { plasmaTestnet, readPlasmaDeployment } from '@autonomousfi/sdk';
import { escrowVaultAbi } from '@autonomousfi/sdk/abis'; // populated by Task 7

const { escrowVault } = readPlasmaDeployment();
const contract = getContract({ address: escrowVault, abi: escrowVaultAbi, client });

// Liveness probe: call a pure/view function that every legit deployment must support.
const version = await contract.read.version();
if (version !== EXPECTED_VERSION) {
  throw new Error(`EscrowVault at ${escrowVault} reports version ${version}; expected ${EXPECTED_VERSION}`);
}

// Bytecode probe: confirm there IS contract code at the address.
const code = await client.getBytecode({ address: escrowVault });
if (!code || code === '0x') {
  throw new Error(`No contract bytecode at ${escrowVault}`);
}
```

For full ABI conformance, run `cast interface <address>` against the deployed
contract (after enabling Plasma in foundry config) and diff its output against
the artifacts in `packages/contracts/out/`. Any drift indicates either a stale
deployment or an unexpected upgrade — both block release.
