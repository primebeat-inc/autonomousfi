# Sprint 3 Implementation Plan: viem Adapter Swap + Plasma Testnet Deploy + CrewAI HTTP Service

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace MockChain consumers with a viem-backed `ChainAdapter` implementation; deploy the Sprint 2 contracts to the real Plasma testnet; ship a long-lived CrewAI HTTP service that kills the 5.7s subprocess startup tax from Sprint 1.

**Architecture:** Introduce a `ChainAdapter` interface that abstracts the four state-changing primitives (`escrowLock`, `escrowRelease`, `escrowRefund`, `hostageStake`, `hostageRefund`, `hostageSlash`) plus read accessors. `MockChain` already implements these semantics inline and stays as the binding semantic spec for unit tests. `ViemChainAdapter` is the new production path: three leaf viem clients (`EscrowVaultClient`, `HostageBondClient`, `ServiceMarketplaceClient`) wired through a single adapter that talks to the deployed Plasma testnet contracts. `paidAgent` is generalised from `chain: MockChain` to `chain: ChainAdapter` so the same orchestration logic drives both. The CrewAI plugin's per-call subprocess fork is replaced by a FastAPI service on `127.0.0.1:8765`, started once per session and reused across all agent calls.

**Tech Stack:** TypeScript 5.6, viem 2.x, abitype 1.x, Foundry (deploy execution only, no new contracts), FastAPI 0.115+, Python 3.11+, vitest 2.x, pnpm workspaces.

**Sprint window:** 2026-06-09 (Tue) to 2026-06-21 (Sun), 12 days. 2 days buffer for testnet stability and demo polish.

**Spec reference:** [`docs/superpowers/specs/2026-05-12-sprint-3-design.md`](../specs/2026-05-12-sprint-3-design.md)

**Sprint 2 closure HEAD:** `2379a8b` (53 Foundry tests, deploy script ready, CI green)

**Binding semantic spec (unchanged):** [`packages/sdk/src/mock-chain.ts`](../../../packages/sdk/src/mock-chain.ts)

---

## Sprint 3 Acceptance Gates

By 2026-06-21 EOD, all of the following must be green:

- [ ] `viem`, `abitype`, `dotenv` installed in `packages/sdk` and lockfile committed
- [ ] `ChainAdapter` interface lives in `packages/sdk/src/clients/chain-adapter.ts` and is exported from the SDK barrel
- [ ] Three viem leaf clients (`EscrowVaultClient`, `HostageBondClient`, `ServiceMarketplaceClient`) implemented and typecheck clean
- [ ] `ViemChainAdapter` implements `ChainAdapter` and passes its own unit suite against an anvil fork of Plasma testnet
- [ ] `packages/sdk/src/config/chains.ts` exports `plasmaTestnet` with chain id, RPC URL, USDT address, deployed contract addresses
- [ ] `.env.deployments` written at repo root with `ESCROW_VAULT_ADDRESS`, `HOSTAGE_BOND_ADDRESS`, `SERVICE_MARKETPLACE_ADDRESS`, `PLASMA_TESTNET_CHAIN_ID`
- [ ] Plasma testnet deploy executed end-to-end (4 addresses recorded, deploy tx hashes captured in `bench/results/sprint-3-deploy.json`)
- [ ] `paidAgent` accepts `chain: ChainAdapter` and all 70+ Sprint 1 SDK tests still pass against `MockChain` with zero test edits
- [ ] `packages/sdk/test/e2e-testnet.test.ts` runs the same happy-path / slash flow as `e2e.test.ts` against `ViemChainAdapter`, gated on `PLASMA_TESTNET_PRIVATE_KEY` env
- [ ] `packages/sdk/scripts/bench-e2e.ts` measures wall-clock createTask through settle and reports under 3 seconds on a warm RPC
- [ ] `packages/crewai-bridge/` FastAPI service ships with 3 unit tests passing
- [ ] `packages/crewai-plugin/crewai_paidagent/bridge.py` calls the HTTP service when `AUTONOMOUSFI_HTTP_URL` is set, falls back to subprocess otherwise, and Python tests cover both paths
- [ ] CI workflow gains a `sdk-testnet` job that runs the testnet e2e suite when the env secret is present (skipped on community forks)
- [ ] Sprint 1 demo updated to point at testnet with a block explorer link in the output

If any gate is red on 2026-06-21, slip it to Sprint 4 explicitly at the bottom of this doc with rationale.

---

## File Structure (Sprint 3 scope)

```
packages/sdk/
├── package.json                                [modify] add viem + abitype + dotenv
├── src/
│   ├── clients/
│   │   ├── chain-adapter.ts                    [NEW, wave 1] ChainAdapter interface + error class
│   │   ├── escrow-vault-client.ts              [NEW, wave 1] viem typed wrapper around EscrowVault
│   │   ├── hostage-bond-client.ts              [NEW, wave 1] viem typed wrapper around HostageBond
│   │   ├── viem-marketplace.ts                 [NEW, wave 1] viem typed wrapper around ServiceMarketplace
│   │   └── viem-chain-adapter.ts               [NEW, wave 1] ViemChainAdapter implementing ChainAdapter
│   ├── config/
│   │   ├── chains.ts                           [NEW, wave 1] plasmaTestnet config + env loader
│   │   └── env.ts                              [NEW, wave 1] dotenv loader for .env.deployments
│   ├── generated/
│   │   └── abis/
│   │       ├── EscrowVault.ts                  [NEW, wave 1] frozen ABI as const
│   │       ├── HostageBond.ts                  [NEW, wave 1]
│   │       └── ServiceMarketplace.ts           [NEW, wave 1]
│   ├── mock-chain.ts                           [unchanged] now also implements ChainAdapter
│   └── paid-agent.ts                           [modify, Task 7] chain: ChainAdapter
├── test/
│   ├── e2e.test.ts                             [unchanged] still runs against MockChain
│   ├── e2e-testnet.test.ts                     [NEW, Task 8] same flow against ViemChainAdapter
│   ├── clients/
│   │   ├── escrow-vault-client.test.ts         [NEW, wave 1]
│   │   ├── hostage-bond-client.test.ts         [NEW, wave 1]
│   │   ├── viem-marketplace.test.ts            [NEW, wave 1]
│   │   └── viem-chain-adapter.test.ts          [NEW, wave 1]
│   └── config/
│       └── chains.test.ts                      [NEW, wave 1]
└── scripts/
    └── bench-e2e.ts                            [NEW, Task 9] wall-clock benchmark

packages/crewai-bridge/                         [NEW, wave 1]
├── pyproject.toml
├── README.md
├── crewai_bridge/
│   ├── __init__.py
│   ├── service.py                              FastAPI app + lifecycle
│   ├── sdk_proxy.py                            Calls the SDK via a single long-lived Node process
│   └── pidfile.py                              PID + idle-timeout helpers
└── tests/
    ├── test_service_health.py
    ├── test_service_lifecycle.py
    └── test_service_task_endpoints.py

packages/crewai-plugin/crewai_paidagent/
├── bridge.py                                   [modify, Task 10] HTTP-first with subprocess fallback
└── tests/
    └── test_bridge_http_path.py                [NEW, Task 10]

.env.deployments.example                        [NEW, Task 6] template (committed; real .env.deployments gitignored)
bench/results/sprint-3-deploy.json              [NEW, Task 6] deploy artifact
bench/results/sprint-3-latency.json             [NEW, Task 9] benchmark artifact
.github/workflows/ci.yml                        [modify, Task 11] add sdk-testnet job
```

**Decomposition rationale:**
- Three leaf viem clients map 1-to-1 to the three Solidity contracts so each can be unit-tested in isolation.
- `ChainAdapter` is a narrow interface, not a class hierarchy, so MockChain stays a plain implementation and we avoid inheritance gymnastics.
- `packages/crewai-bridge/` is a new Python package, separate from `packages/crewai-plugin/`, because the bridge is the service and the plugin is the consumer. Two responsibilities, two packages.
- `.env.deployments` is repo-root rather than per-package so the deploy script and SDK config load the same file.

---

## Skills to load before starting

- `superpowers:test-driven-development`
- `superpowers:verification-before-completion`
- `everything-claude-code:tdd-workflow` for the Python service
- (execution skill chosen at handoff)

---

## Wave 1 status (already landing concurrently)

Tasks 1 through 5 of this plan are being implemented in parallel by sibling agents while this plan is written. They cover scaffolding only and do not block one another. Their commits will land on `main` before Task 6 starts. This section documents the expected end-state of each so reviewers can verify the wave.

### Task 1: viem deps install + ChainAdapter interface

**Files:**
- Modify: `packages/sdk/package.json` (add `viem ^2.21.0`, `abitype ^1.0.0`, `dotenv ^16.4.0`)
- Create: `packages/sdk/src/clients/chain-adapter.ts`
- Modify: `packages/sdk/src/index.ts` (export `ChainAdapter`)

- [ ] **Step 1: Write failing test for ChainAdapter interface shape**

`packages/sdk/test/clients/chain-adapter.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import type { ChainAdapter } from '../../src/clients/chain-adapter.js';
import { MockChain } from '../../src/mock-chain.js';

describe('ChainAdapter contract', () => {
  it('MockChain satisfies ChainAdapter shape', () => {
    const c: ChainAdapter = new MockChain();
    expect(typeof c.escrowLock).toBe('function');
    expect(typeof c.escrowRelease).toBe('function');
    expect(typeof c.escrowRefund).toBe('function');
    expect(typeof c.hostageStake).toBe('function');
    expect(typeof c.hostageRefund).toBe('function');
    expect(typeof c.hostageSlash).toBe('function');
    expect(typeof c.getEscrowStatus).toBe('function');
    expect(typeof c.getHostageStatus).toBe('function');
  });
});
```

- [ ] **Step 2: Run and confirm fail** (module not found).
- [ ] **Step 3: Implement `ChainAdapter` as a TypeScript interface** with the six state-changing primitives (matching MockChain signatures) plus `getEscrowStatus` and `getHostageStatus`. Methods return `Promise<...>` so the same surface fits both sync MockChain and async viem implementations (MockChain wraps return values in `Promise.resolve(...)`).
- [ ] **Step 4: Run, expect pass.**
- [ ] **Step 5: Commit**

```bash
git add packages/sdk/package.json packages/sdk/pnpm-lock.yaml packages/sdk/src/clients/chain-adapter.ts packages/sdk/src/index.ts packages/sdk/test/clients/chain-adapter.test.ts
git commit -m "feat(sdk): ChainAdapter interface + viem/abitype/dotenv deps"
```

### Task 2: Three leaf viem clients

**Files:**
- Create: `packages/sdk/src/generated/abis/{EscrowVault,HostageBond,ServiceMarketplace}.ts` (frozen ABI as const, copied from `packages/contracts/out/<Name>.sol/<Name>.json`)
- Create: `packages/sdk/src/clients/escrow-vault-client.ts`
- Create: `packages/sdk/src/clients/hostage-bond-client.ts`
- Create: `packages/sdk/src/clients/viem-marketplace.ts`
- Create: matching `*.test.ts` files under `packages/sdk/test/clients/`

- [ ] **Step 1: Write failing tests for each client** using viem's `createTestClient` + anvil. Tests stub the chain locally so they run in CI without testnet access. Each test covers: read calls, state-changing calls, custom error decoding.
- [ ] **Step 2: Run and confirm fail.**
- [ ] **Step 3: Implement each client** as a thin viem wrapper. Read calls via `publicClient.readContract`; state-changing via `walletClient.writeContract` then `publicClient.waitForTransactionReceipt`. Custom error decoding via `decodeErrorResult` so a Solidity `UnknownTask(bytes32)` surfaces as a typed `UnknownTaskError` in TypeScript.
- [ ] **Step 4: Run, expect pass.**
- [ ] **Step 5: Commit each client + tests in three separate commits** so reviewers can read them independently:

```bash
git commit -m "feat(sdk): EscrowVaultClient viem wrapper + custom error decoding"
git commit -m "feat(sdk): HostageBondClient viem wrapper + custom error decoding"
git commit -m "feat(sdk): ServiceMarketplaceClient viem wrapper + state machine assertions"
```

### Task 3: ViemChainAdapter implementing ChainAdapter

**Files:**
- Create: `packages/sdk/src/clients/viem-chain-adapter.ts`
- Create: `packages/sdk/test/clients/viem-chain-adapter.test.ts`

- [ ] **Step 1: Write failing test** that constructs a `ViemChainAdapter` against anvil, runs the same six-method contract as the MockChain test, and verifies funds-conservation invariant on a single createTask through settle cycle.
- [ ] **Step 2: Run and confirm fail.**
- [ ] **Step 3: Implement `ViemChainAdapter`** as a class that holds references to the three leaf clients plus the requester wallet. Each `ChainAdapter` method delegates to the appropriate leaf client. Approval flow handled internally: before `escrowLock`, the adapter calls `allowance` on USDT; if insufficient, it runs `approve` then proceeds. Same for `hostageStake`. `getEscrowStatus` and `getHostageStatus` read directly from the leaf client and map the on-chain enum value to the same `'Locked' | 'Released' | 'Refunded'` strings that MockChain returns.
- [ ] **Step 4: Run, expect pass.**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat(sdk): ViemChainAdapter wiring three leaf clients to ChainAdapter contract"
```

### Task 4: Plasma testnet chain config + env loader

**Files:**
- Create: `packages/sdk/src/config/chains.ts`
- Create: `packages/sdk/src/config/env.ts`
- Create: `packages/sdk/test/config/chains.test.ts`
- Create: `.env.deployments.example` at repo root

- [ ] **Step 1: Write failing test for chain config**

```ts
import { describe, it, expect } from 'vitest';
import { plasmaTestnet, loadChainConfig } from '../../src/config/chains.js';

describe('chains config', () => {
  it('plasmaTestnet has required fields', () => {
    expect(plasmaTestnet.id).toBeGreaterThan(0);
    expect(plasmaTestnet.rpcUrls.default.http[0]).toMatch(/^https:\/\//);
    expect(plasmaTestnet.contracts.escrowVault).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it('loadChainConfig reads .env.deployments when present', () => {
    const cfg = loadChainConfig({ envOverride: { ESCROW_VAULT_ADDRESS: '0x1234...' } });
    expect(cfg.escrowVault).toMatch(/^0x/);
  });
});
```

- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Implement `chains.ts`** with a viem `Chain` definition for Plasma testnet (chain id, RPC URL from env or default, block explorer URL). `loadChainConfig` reads `.env.deployments` via `dotenv.config({ path: ... })` and returns the four contract addresses. Default addresses are `0x0000...000` placeholders so tests do not need a real deployment.
- [ ] **Step 4: Implement `env.ts`** as a small wrapper around dotenv that picks the right path based on `process.cwd()` and `AUTONOMOUSFI_ENV_FILE` env override.
- [ ] **Step 5: Add `.env.deployments.example`** at repo root listing the four required keys with empty values and a comment pointing at the deploy script.
- [ ] **Step 6: Run, expect pass.**
- [ ] **Step 7: Commit**

```bash
git commit -m "feat(sdk): Plasma testnet chain config + .env.deployments loader"
```

### Task 5: CrewAI HTTP service skeleton

**Files:**
- Create: `packages/crewai-bridge/pyproject.toml`
- Create: `packages/crewai-bridge/crewai_bridge/service.py`
- Create: `packages/crewai-bridge/crewai_bridge/sdk_proxy.py`
- Create: `packages/crewai-bridge/crewai_bridge/pidfile.py`
- Create: `packages/crewai-bridge/tests/test_service_health.py`
- Create: `packages/crewai-bridge/tests/test_service_lifecycle.py`
- Create: `packages/crewai-bridge/tests/test_service_task_endpoints.py`

- [ ] **Step 1: Write failing tests** (3 total):
  - `test_service_health.py`: starts the FastAPI app via `TestClient`, hits `GET /health`, expects 200 + `{"status": "ok"}`.
  - `test_service_lifecycle.py`: ensures `start_service()` writes a PID file, `stop_service()` removes it, idle-timeout triggers shutdown.
  - `test_service_task_endpoints.py`: hits `POST /tasks` with a sample payload, asserts 200 + the response carries `taskHash`, `status: 'settled'` (against a mocked sdk_proxy that returns a fixed PaidAgentOutcome).
- [ ] **Step 2: Run, confirm fail.**
- [ ] **Step 3: Implement `service.py`** as a FastAPI app exposing `GET /health`, `POST /tasks`, `GET /tasks/{hash}`. The route handlers call into `sdk_proxy.invoke_paid_agent(...)`. `sdk_proxy` spawns the Node SDK as a single long-lived process at module import time and reuses it across calls via stdin/stdout JSON-line protocol. `pidfile.py` writes `~/.autonomousfi/crewai-bridge.pid` and provides an idle-timeout watchdog (5 min default).
- [ ] **Step 4: Run, expect 3 pass.**
- [ ] **Step 5: Commit**

```bash
git commit -m "feat(crewai-bridge): FastAPI service with health + task endpoints + lifecycle"
```

---

## Task 6: Plasma testnet deploy execution

**Files:**
- Create: `.env.deployments` (gitignored; real addresses)
- Create: `bench/results/sprint-3-deploy.json`
- Modify: `packages/sdk/src/config/chains.ts` (commit real addresses if Plasma testnet deploy is stable)
- Modify: `.gitignore` (ensure `.env.deployments` is ignored)

This task moves from scaffolding into running real on-chain transactions. **Pre-flight: the executor must have the Plasma testnet RPC URL, a funded deployer wallet (USDT for testing + native gas), and the admin Safe address ready.** Sprint 2 design Q1 fixed the RPC as the official Tether endpoint with a fallback; both go into the env.

- [ ] **Step 1: Confirm `.gitignore` covers `.env.deployments`**

```bash
grep -q '^\.env\.deployments$' .gitignore || echo '.env.deployments' >> .gitignore
git diff .gitignore
```

- [ ] **Step 2: Populate deploy env locally**

Create `.env.deployments` at repo root (not committed):
```
PLASMA_TESTNET_RPC_URL=<official Tether endpoint>
PLASMA_TESTNET_RPC_URL_FALLBACK=<fallback>
PLASMA_TESTNET_CHAIN_ID=<from RPC chainId>
USDT_ADDRESS=<Plasma testnet USDT bridge address>
ADMIN_ADDRESS=<Prime Beat Safe multisig address>
DEPLOYER_PRIVATE_KEY=<dev key; never commit>
```

- [ ] **Step 3: Dry run the deploy script against a mainnet fork of Plasma**

```bash
cd packages/contracts
source ../../.env.deployments
forge script script/DeployTestnet.s.sol \
  --rpc-url $PLASMA_TESTNET_RPC_URL \
  --sender $(cast wallet address $DEPLOYER_PRIVATE_KEY) \
  --sig "run()"
```
Expected: simulation prints the three addresses and exits 0. **Do not broadcast yet.** If the simulation reverts, investigate before spending real gas.

- [ ] **Step 4: Broadcast the deploy**

```bash
forge script script/DeployTestnet.s.sol \
  --rpc-url $PLASMA_TESTNET_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --slow \
  --sig "run()" \
  | tee /tmp/deploy.log
```
Expected: 3 deploy transactions land, 4 role grants land (2 OPERATOR_ROLE + 2 DEFAULT_ADMIN_ROLE), 4 role revokes land. Total 11 transactions. Script prints the three contract addresses to stdout.

- [ ] **Step 5: Capture deploy artifacts**

Extract the three addresses and the tx hashes from `broadcast/DeployTestnet.s.sol/<chainId>/run-latest.json` and write `bench/results/sprint-3-deploy.json`:
```json
{
  "chainId": "<id>",
  "rpcUrl": "<url>",
  "deployedAt": "2026-06-XX...",
  "contracts": {
    "escrowVault": "0x...",
    "hostageBond": "0x...",
    "serviceMarketplace": "0x..."
  },
  "deployTxHashes": ["0x...", "0x...", "0x..."],
  "deployer": "0x...",
  "admin": "0x...",
  "usdtAddress": "0x..."
}
```

- [ ] **Step 6: Verify addresses match between leaf and orchestrator**

```bash
cast call $SERVICE_MARKETPLACE_ADDRESS "escrow()(address)" --rpc-url $PLASMA_TESTNET_RPC_URL
cast call $SERVICE_MARKETPLACE_ADDRESS "bond()(address)" --rpc-url $PLASMA_TESTNET_RPC_URL
```
Expected: outputs match `escrowVault` and `hostageBond` from the artifact.

- [ ] **Step 7: Verify role grants**

```bash
ESCROW_OP_ROLE=$(cast call $ESCROW_VAULT_ADDRESS "OPERATOR_ROLE()(bytes32)" --rpc-url $PLASMA_TESTNET_RPC_URL)
cast call $ESCROW_VAULT_ADDRESS "hasRole(bytes32,address)(bool)" $ESCROW_OP_ROLE $SERVICE_MARKETPLACE_ADDRESS --rpc-url $PLASMA_TESTNET_RPC_URL
# expect: true
cast call $ESCROW_VAULT_ADDRESS "hasRole(bytes32,address)(bool)" $ESCROW_OP_ROLE $DEPLOYER_ADDRESS --rpc-url $PLASMA_TESTNET_RPC_URL
# expect: false (deployer revoked itself)
```
Repeat for HostageBond.

- [ ] **Step 8: Verify on Plasma block explorer**

Open each tx hash on the testnet block explorer (Tether's Plasma explorer or Blockscout equivalent). Confirm the contracts show as verified or queue them for verification.

- [ ] **Step 9: Bake the addresses into `chains.ts`**

Update `packages/sdk/src/config/chains.ts` with the four addresses as the default values. `loadChainConfig` still allows env overrides for engineers running against a private fork.

- [ ] **Step 10: Commit deploy artifacts**

```bash
git add bench/results/sprint-3-deploy.json packages/sdk/src/config/chains.ts .gitignore
git commit -m "deploy(contracts): Plasma testnet live - 3 contracts + role grants verified"
```

If any step fails, **stop and triage before retrying**. Re-running the deploy script blindly will deploy duplicate contracts and waste testnet gas.

---

## Task 7: paidAgent refactor to accept ChainAdapter

**Files:**
- Modify: `packages/sdk/src/paid-agent.ts`
- Modify: `packages/sdk/src/mock-chain.ts` (only if needed to satisfy the async ChainAdapter contract; preferred: keep MockChain sync internally and adapt at the type level)
- Modify: existing tests under `packages/sdk/test/` only if a type error surfaces; goal is zero behavioural change

This task is the bridge between Wave 1 scaffolding and live testnet usage. The contract is simple: `PaidAgentOptions.chain` switches from `MockChain` to `ChainAdapter`, and `paidAgent` awaits each chain call. MockChain implements `ChainAdapter` so the 70+ existing tests run unchanged.

- [ ] **Step 1: Run the existing SDK test suite to capture the pre-refactor baseline**

```bash
cd packages/sdk
pnpm run test 2>&1 | tee /tmp/sdk-baseline.txt
```
Record the test count and the assertion count. Expected: 70+ tests, all green.

- [ ] **Step 2: Confirm MockChain already satisfies `ChainAdapter`** by reading `chain-adapter.test.ts` from Wave 1 (Task 1). If MockChain returns sync values but `ChainAdapter` requires `Promise<...>`, wrap MockChain's return values in `Promise.resolve(...)` at the method level. Do not change the underlying sync state machine.

- [ ] **Step 3: Update `PaidAgentOptions`**

```ts
export interface PaidAgentOptions {
  // ... unchanged fields
  readonly chain: ChainAdapter;  // was: MockChain
}
```

`paidAgent` now does `await opts.chain.escrowLock(...)`, `await opts.chain.hostageStake(...)`, etc. The control flow stays identical; only the awaits are new.

- [ ] **Step 4: Re-run the SDK test suite**

```bash
pnpm run test
```
Expected: 70+ tests still pass with zero edits. If any test fails because it was reading a sync return value, fix MockChain (not the test) so the public surface stays identical at runtime.

- [ ] **Step 5: Typecheck**

```bash
pnpm run typecheck
```
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add packages/sdk/src/paid-agent.ts packages/sdk/src/mock-chain.ts
git commit -m "refactor(sdk): paidAgent accepts ChainAdapter; MockChain and ViemChainAdapter both fit"
```

---

## Task 8: e2e tests against Plasma testnet

**Files:**
- Create: `packages/sdk/test/e2e-testnet.test.ts`
- Modify: `packages/sdk/vitest.config.ts` (if needed, register a `testnet` test name pattern for the optional CI job)

The new test file mirrors `packages/sdk/test/e2e.test.ts` move-for-move but constructs `ViemChainAdapter` instead of `MockChain`. It is **gated on `PLASMA_TESTNET_PRIVATE_KEY` env**: when the env is missing, the suite calls `it.skip(...)` and exits green so PR CI on community forks stays clean.

- [ ] **Step 1: Write the test file**

```ts
import { describe, it, expect } from 'vitest';
import { ViemChainAdapter } from '../src/clients/viem-chain-adapter.js';
import { plasmaTestnet, loadChainConfig } from '../src/config/chains.js';
import { paidAgent } from '../src/paid-agent.js';
import { QVACQualityVerifier, StubLLMJudge } from '../src/quality.js';
import type { AgentAddress, Price } from '../src/types.js';

const PRIVATE_KEY = process.env.PLASMA_TESTNET_PRIVATE_KEY;
const skipIfNoKey = PRIVATE_KEY ? describe : describe.skip;

skipIfNoKey('e2e against Plasma testnet', () => {
  it('settles on real chain', async () => {
    const cfg = loadChainConfig();
    const adapter = new ViemChainAdapter({
      chain: plasmaTestnet,
      rpcUrl: cfg.rpcUrl,
      privateKey: PRIVATE_KEY as `0x${string}`,
      contracts: cfg
    });

    const requester = adapter.address as AgentAddress;
    const provider = process.env.PLASMA_TESTNET_PROVIDER_ADDRESS as AgentAddress;

    const judge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.92 }));
    const review = paidAgent(
      {
        price: 100n as Price,
        stake: 50n as Price,
        qualityThreshold: 0.85,
        deadlineMs: 60_000,
        providerAddress: provider,
        chain: adapter,
        judge
      },
      async (s: string) => `Reviewed: ${s} looks good`
    );

    const out = await review.call(requester, { snippet: 'function add(a,b){return a+b}' });
    expect(out.status).toBe('settled');
    expect(out.score).toBeGreaterThanOrEqual(0.85);
  }, 60_000);

  it('slashes on real chain when judge fails', async () => {
    // same shape as above, but judge.failOn forces slash
  }, 60_000);
});
```

- [ ] **Step 2: Run locally with the env present**

```bash
PLASMA_TESTNET_PRIVATE_KEY=0x... \
PLASMA_TESTNET_PROVIDER_ADDRESS=0x... \
pnpm --filter @autonomousfi/sdk run test -- test/e2e-testnet.test.ts
```
Expected: 2 tests pass, each completing in roughly 15 to 30 seconds (RPC latency dominated).

- [ ] **Step 3: Run without the env**

```bash
pnpm --filter @autonomousfi/sdk run test -- test/e2e-testnet.test.ts
```
Expected: 2 tests show as skipped, suite exits 0.

- [ ] **Step 4: Inspect a settled tx on the block explorer**

Copy the `release` tx hash from the test output. Confirm on the Plasma testnet explorer that the USDT transfer landed at the provider address. Save the link in `bench/results/sprint-3-deploy.json` under a new `firstSettleTxUrl` key.

- [ ] **Step 5: Commit**

```bash
git add packages/sdk/test/e2e-testnet.test.ts bench/results/sprint-3-deploy.json
git commit -m "test(sdk): e2e against Plasma testnet (env-gated, skips on community forks)"
```

---

## Task 9: Latency benchmark

**Files:**
- Create: `packages/sdk/scripts/bench-e2e.ts`
- Create: `bench/results/sprint-3-latency.json`

The benchmark times one full createTask through settle round trip against testnet. Sprint 1's subprocess baseline was 5.7 seconds. Target: under 3 seconds wall clock with a warm RPC and a warm CrewAI bridge.

- [ ] **Step 1: Write the script**

```ts
// packages/sdk/scripts/bench-e2e.ts
import { performance } from 'node:perf_hooks';
import { ViemChainAdapter } from '../src/clients/viem-chain-adapter.js';
import { plasmaTestnet, loadChainConfig } from '../src/config/chains.js';
import { paidAgent } from '../src/paid-agent.js';
import { QVACQualityVerifier, StubLLMJudge } from '../src/quality.js';
import { writeFileSync } from 'node:fs';
import type { AgentAddress, Price } from '../src/types.js';

const PRIVATE_KEY = process.env.PLASMA_TESTNET_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error('PLASMA_TESTNET_PRIVATE_KEY required');
  process.exit(1);
}

async function main() {
  const cfg = loadChainConfig();
  const adapter = new ViemChainAdapter({
    chain: plasmaTestnet,
    rpcUrl: cfg.rpcUrl,
    privateKey: PRIVATE_KEY as `0x${string}`,
    contracts: cfg
  });
  const judge = new QVACQualityVerifier(new StubLLMJudge({ matchScore: 0.92 }));
  const review = paidAgent(
    {
      price: 100n as Price,
      stake: 50n as Price,
      qualityThreshold: 0.85,
      deadlineMs: 60_000,
      providerAddress: process.env.PLASMA_TESTNET_PROVIDER_ADDRESS as AgentAddress,
      chain: adapter,
      judge
    },
    async () => 'benchmark result'
  );

  const runs: number[] = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await review.call(adapter.address as AgentAddress, { i });
    runs.push(performance.now() - t0);
  }
  const p50 = runs.sort((a, b) => a - b)[Math.floor(runs.length / 2)];
  const result = {
    runs,
    p50_ms: p50,
    target_ms: 3000,
    pass: p50 < 3000,
    timestamp: new Date().toISOString()
  };
  writeFileSync('bench/results/sprint-3-latency.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (!result.pass) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Add a script entry in `packages/sdk/package.json`**

```json
"scripts": {
  ...,
  "bench:e2e": "tsx scripts/bench-e2e.ts"
}
```

- [ ] **Step 3: Run**

```bash
PLASMA_TESTNET_PRIVATE_KEY=0x... PLASMA_TESTNET_PROVIDER_ADDRESS=0x... \
pnpm --filter @autonomousfi/sdk run bench:e2e
```
Expected: 5 runs, p50 under 3000 ms, exit 0. If p50 exceeds 3000 ms, investigate: confirm the RPC is healthy, confirm `waitForTransactionReceipt` is not paying a full block time per call (testnet block time should be a few hundred ms), confirm no unnecessary allowance checks on each call (cache the allowance after the first lock).

- [ ] **Step 4: Commit**

```bash
git add packages/sdk/scripts/bench-e2e.ts packages/sdk/package.json bench/results/sprint-3-latency.json
git commit -m "bench(sdk): e2e wall-clock benchmark, p50 under 3s on Plasma testnet"
```

---

## Task 10: CrewAI plugin swap to HTTP service

**Files:**
- Modify: `packages/crewai-plugin/crewai_paidagent/bridge.py`
- Create: `packages/crewai-plugin/tests/test_bridge_http_path.py`

The plugin must call the HTTP service when `AUTONOMOUSFI_HTTP_URL` is set; otherwise it falls back to the Sprint 1 subprocess path. Both paths share the same `BridgeResult` return type so callers do not need to branch.

- [ ] **Step 1: Write failing test for the HTTP path**

`packages/crewai-plugin/tests/test_bridge_http_path.py`:
```python
import os
import pytest
from unittest.mock import patch, MagicMock
from crewai_paidagent.bridge import invoke_paid_agent, BridgeResult


def test_http_path_when_env_set(monkeypatch):
    monkeypatch.setenv("AUTONOMOUSFI_HTTP_URL", "http://127.0.0.1:8765")

    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_response.json.return_value = {
        "status": "settled",
        "score": 0.92,
        "result": "ok"
    }

    with patch("crewai_paidagent.bridge.requests.post", return_value=fake_response) as mock_post:
        out = invoke_paid_agent(
            price=100,
            stake=50,
            quality_threshold=0.85,
            provider_address="0xBBBB",
            requester_address="0xAAAA",
            input_payload={"x": 1},
            result_text="hello",
        )
        assert isinstance(out, BridgeResult)
        assert out.status == "settled"
        assert out.score == 0.92
        mock_post.assert_called_once()
        url = mock_post.call_args[0][0]
        assert "127.0.0.1:8765" in url


def test_subprocess_fallback_when_env_missing(monkeypatch):
    monkeypatch.delenv("AUTONOMOUSFI_HTTP_URL", raising=False)
    # existing subprocess test still runs
```

- [ ] **Step 2: Run, confirm fail** (the import or branch does not yet exist).
- [ ] **Step 3: Modify `bridge.py`**

```python
import os
import json
import requests
import subprocess
# ... existing imports

def invoke_paid_agent(...) -> BridgeResult:
    http_url = os.environ.get("AUTONOMOUSFI_HTTP_URL")
    if http_url:
        return _invoke_via_http(http_url, ...)
    return _invoke_via_subprocess(...)

def _invoke_via_http(http_url, ...):
    resp = requests.post(
        f"{http_url}/tasks",
        json={...payload...},
        timeout=30,
    )
    if resp.status_code != 200:
        raise RuntimeError(f"bridge http failed: {resp.status_code} {resp.text}")
    body = resp.json()
    return BridgeResult(status=body["status"], score=body["score"], result=body["result"])

def _invoke_via_subprocess(...):
    # existing Sprint 1 code, unchanged
```

- [ ] **Step 4: Run all Python tests in the plugin**

```bash
cd packages/crewai-plugin
pytest
```
Expected: existing tests still pass (subprocess path), new HTTP test passes, no regressions.

- [ ] **Step 5: Smoke test against the live bridge**

```bash
# terminal 1
cd packages/crewai-bridge
python -m crewai_bridge.service  # starts FastAPI on 127.0.0.1:8765

# terminal 2
AUTONOMOUSFI_HTTP_URL=http://127.0.0.1:8765 \
python -c "from crewai_paidagent.bridge import invoke_paid_agent; print(invoke_paid_agent(price=100, stake=50, quality_threshold=0.85, provider_address='0xB', requester_address='0xA', input_payload={'x':1}, result_text='ok'))"
```
Expected: a `BridgeResult(status='settled', ...)` prints. Measured wall clock should be under 1 second on a warm service.

- [ ] **Step 6: Commit**

```bash
git add packages/crewai-plugin/crewai_paidagent/bridge.py packages/crewai-plugin/tests/test_bridge_http_path.py
git commit -m "feat(crewai-plugin): bridge.py prefers HTTP service when AUTONOMOUSFI_HTTP_URL set"
```

---

## Task 11: CI workflow gains an optional sdk-testnet job

**Files:**
- Modify: `.github/workflows/ci.yml`

The job runs the testnet e2e suite when the `PLASMA_TESTNET_PRIVATE_KEY` secret is present in the repo. It skips cleanly otherwise so community forks and dependabot PRs do not fail.

- [ ] **Step 1: Add the job**

```yaml
  sdk-testnet:
    runs-on: ubuntu-latest
    if: ${{ secrets.PLASMA_TESTNET_PRIVATE_KEY != '' }}
    needs: sdk
    env:
      PLASMA_TESTNET_PRIVATE_KEY: ${{ secrets.PLASMA_TESTNET_PRIVATE_KEY }}
      PLASMA_TESTNET_PROVIDER_ADDRESS: ${{ secrets.PLASMA_TESTNET_PROVIDER_ADDRESS }}
      ESCROW_VAULT_ADDRESS: ${{ vars.ESCROW_VAULT_ADDRESS }}
      HOSTAGE_BOND_ADDRESS: ${{ vars.HOSTAGE_BOND_ADDRESS }}
      SERVICE_MARKETPLACE_ADDRESS: ${{ vars.SERVICE_MARKETPLACE_ADDRESS }}
      PLASMA_TESTNET_RPC_URL: ${{ vars.PLASMA_TESTNET_RPC_URL }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.12.0 }
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @autonomousfi/sdk run test -- test/e2e-testnet.test.ts
```

- [ ] **Step 2: Configure secrets and repo vars**

In GitHub repo settings:
- Secrets: `PLASMA_TESTNET_PRIVATE_KEY`, `PLASMA_TESTNET_PROVIDER_ADDRESS`
- Variables: `ESCROW_VAULT_ADDRESS`, `HOSTAGE_BOND_ADDRESS`, `SERVICE_MARKETPLACE_ADDRESS`, `PLASMA_TESTNET_RPC_URL`

Done manually by the CEO with the addresses from Task 6.

- [ ] **Step 3: Push and confirm CI**

The `sdk-testnet` job should pass on `main` after the secrets are populated. Dependabot PRs should show `sdk-testnet` as skipped (not failed) because the secret is not exposed to forked workflows.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci(sdk): optional sdk-testnet job runs e2e against Plasma testnet when secret present"
```

---

## Acceptance verification

Before declaring Sprint 3 complete, run the following all-green check from the repo root:

```bash
# SDK MockChain tests still pass (no regression from Sprint 1)
pnpm -r run typecheck
pnpm -r run test
pnpm -r run build

# Testnet e2e (with env)
PLASMA_TESTNET_PRIVATE_KEY=0x... PLASMA_TESTNET_PROVIDER_ADDRESS=0x... \
  pnpm --filter @autonomousfi/sdk run test -- test/e2e-testnet.test.ts

# Latency benchmark
PLASMA_TESTNET_PRIVATE_KEY=0x... PLASMA_TESTNET_PROVIDER_ADDRESS=0x... \
  pnpm --filter @autonomousfi/sdk run bench:e2e

# CrewAI bridge tests
cd packages/crewai-bridge && pytest && cd ../..
cd packages/crewai-plugin && pytest && cd ../..

# Foundry contracts still green (Sprint 2 baseline preserved)
cd packages/contracts && forge build && forge test && cd ../..

# CI green on main
gh run list --workflow=CI --branch=main --limit=1
```

All must succeed. The p50 latency line in the benchmark output must be under 3000 ms.

---

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Plasma testnet RPC flaky during deploy | Medium | High | Fallback RPC configured; deploy script supports `--slow` flag for retries |
| viem typed gen breaks on ABI churn | Low | Medium | Generated ABIs committed and pinned; Sprint 2 freezes ABIs at sprint close |
| CrewAI HTTP service port collision | Low | Low | Service detects busy port and surfaces a clear error; configurable via env |
| Testnet USDT faucet rate limit | Medium | Low | Pre-fund deployer with 1000 USDT before sprint start; document top-up procedure |
| Latency exceeds 3s due to block time | Medium | Medium | Cache USDT allowance after first call; reduce confirmation waits to 1 block; investigate RPC region |
| Provider pre-approval missing on testnet | Medium | High | Provider wallet runs a one-time `approve(HostageBond, max)` script before e2e tests; documented in `e2e-testnet.test.ts` setup |

---

## Phase 1 Sprint 4-6 outline (next plans)

| Sprint | Window | Scope | Plan path |
|---|---|---|---|
| 4 | 2026-06-23 to 07-05 | Risc0 reputation circuit + property tests + bench | future plan |
| 5 | 2026-07-07 to 07-19 | zkPassport integration + PoP-gated discovery | future plan |
| 6 | 2026-07-21 to 07-31 | Phase 1 closure + Tether grant filings + Phase 2 plan | future plan |

Each gets its own writing-plans invocation with full TDD breakdown.

---

**Plan version:** v1 (2026-05-12). After plan-document-reviewer approval and user review, hand off to execution. Sprint 3 starts 2026-06-09.
