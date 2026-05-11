# Sprint 3 Design Doc: Plasma Testnet Deploy + viem Adapter Swap

**Date**: 2026-05-12
**Sprint Window**: 2026-06-09 to 2026-06-21 (12 days, after Sprint 2 contracts land)
**Audience**: Engineers replacing MockChain consumers with viem-backed clients and shipping the CrewAI HTTP service
**Complements**: Sprint 2 design spec (`docs/superpowers/specs/2026-05-12-sprint-2-design.md`)

## Sprint 3 Goal

Replace MockChain consumers with viem-backed clients; deploy contracts to Plasma testnet; CrewAI plugin gets long-lived HTTP service replacing subprocess bridge.

The MockChain interface stays as the reference fixture for SDK unit tests. Production paths swap to a viem client that points at the Plasma testnet RPC defined in Sprint 2 Q1. The CrewAI plugin stops shelling out per call and instead runs a persistent HTTP service that the Python agent talks to over localhost. This kills the 5.7s subprocess startup tax seen in the Sprint 1 demo.

Every consumer of the chain interface gets a one-line config flip: `MockChain` for tests, `ViemChain` for testnet and beyond. The SDK public surface stays identical so the 70+ Sprint 1 SDK tests still pass without modification.

## Window

- **Start**: 2026-06-09 (Tuesday after Sprint 2 audit handoff on 2026-06-07)
- **End**: 2026-06-21 (Sunday)
- **Working days**: 12
- **Buffer**: 2 days for testnet stability fixes and demo polish at the end

## Sub-tasks

### 1. Plasma testnet RPC config

SDK reads chain config from `packages/sdk/src/config/chains.ts`. Add a `plasmaTestnet` entry with the RPC URL chosen in Sprint 2 Q1 (default: official Tether endpoint with a fallback URL). Chain ID, block explorer URL, USDT bridge address, and deployed contract addresses live here. Contract addresses are populated by the Sprint 2 deploy artifacts.

Config is environment-driven: `AUTONOMOUSFI_CHAIN=plasma-testnet` flips production paths. Default in test runner stays `mock`.

### 2. viem typed client gen

Generate viem-compatible TypeScript types from Sprint 2 ABIs using `wagmi-cli` or `abitype`. Output lives in `packages/sdk/src/generated/abis/`. CI gates the generated files: if ABIs change, regen runs and PRs that forget to commit the diff fail.

Public client and wallet client wrappers live in `packages/sdk/src/viem/clients.ts`. Each contract gets a typed wrapper that mirrors MockChain method signatures. Read calls use the public client; state-changing calls use the wallet client with the configured signer.

### 3. USDTEscrow client viem impl

`packages/sdk/src/viem/escrow-vault.ts` implements the `IEscrowVault` interface (extracted from MockChain) using viem. Methods: `lock`, `release`, `refund`, `getStatus`. All errors decoded from custom error signatures so `EscrowVault.UnknownTask` etc. throw the same TypeScript error class as MockChain. ERC20 approval handled internally: client checks current allowance, runs `approve` if insufficient, then `lock`. ERC-2612 `permit` path used when USDT on Plasma supports it (Sprint 2 Q3 default: support both).

### 4. HostageBond client viem impl

`packages/sdk/src/viem/hostage-bond.ts` implements `IHostageBond`. Methods: `stake`, `refund`, `slash`, `getStatus`. Same error decoding pattern. Same approval flow. ServiceMarketplace orchestration client (`packages/sdk/src/viem/service-marketplace.ts`) wires escrow and bond together exactly as MockChain does.

### 5. e2e tests against testnet

New test suite `packages/sdk/test/e2e-testnet/` runs against live Plasma testnet. Test wallets funded from a treasury faucet seeded at Sprint 2 deploy. Tests cover happy path (createTask → acceptTask → submitResult → settle), refund path (deadline expiry), and dispute path (admin slash override). Tests are tagged `@testnet` and run on a nightly CI cadence to avoid hammering the RPC during regular PR CI.

Tests do not replace the 70+ Sprint 1 SDK tests; those continue to run against MockChain on every PR for fast feedback.

### 6. CrewAI HTTP service (replaces subprocess)

New package `packages/crewai-bridge/` ships a long-lived HTTP service (FastAPI) that exposes the SDK over localhost. The Python CrewAI plugin (`plugins/crewai-autonomousfi/`) talks to it over `http://127.0.0.1:8765` instead of spawning a Node subprocess per call. Service auto-starts on first Python import via a lifecycle helper that writes a PID file and tails logs to `~/.autonomousfi/crewai-bridge.log`. Service exits when no client has called for 5 minutes (idle timeout).

API surface mirrors the SDK: `POST /tasks` (createTask), `GET /tasks/:hash` (status), `POST /tasks/:hash/accept`, `POST /tasks/:hash/submit`, `POST /tasks/:hash/settle`, `POST /tasks/:hash/dispute`. JSON payloads. Errors map to HTTP 4xx with the SDK error code in the body.

This is the single biggest UX win of Sprint 3 for downstream Python integrators. CrewAI agents now feel like they are calling a local API, not invoking a fork-exec per move.

### 7. Demo updated to testnet

The Sprint 1 demo script (`examples/crewai-demo/`) flips from MockChain to Plasma testnet via the env var. Demo wallet keys live in `examples/crewai-demo/.env.example`; real keys are loaded from a local Safe or a 1Password vault entry, never committed.

Demo also drops the subprocess invocation and uses the new HTTP service. Visible improvement: latency drops, output is cleaner, and the demo now runs against real on-chain state that can be inspected on the Plasma testnet block explorer.

### 8. Latency benchmark

Reproducible benchmark script `packages/sdk/bench/end-to-end.ts` measures wall-clock latency from CrewAI task creation to settlement confirmation. Target: under 3 seconds end-to-end on a warm CrewAI bridge process and a healthy RPC. Compare against Sprint 1's 5.7s subprocess baseline. Benchmark output committed to `bench/results/sprint-3.json` so Sprint 4 has a baseline to defend.

## Acceptance Gates

All gates must be green to close Sprint 3.

- **SDK 70+ tests still pass against MockChain**: `pnpm --filter @autonomousfi/sdk test` green with no test modifications. The viem swap is additive; MockChain interface stays intact.
- **New testnet e2e tests pass**: `pnpm --filter @autonomousfi/sdk test:e2e-testnet` green on a clean run. Nightly CI green for 3 consecutive nights before sprint close.
- **CrewAI demo runs under 3 seconds end-to-end**: measured by the benchmark script. Improvement from 5.7s subprocess baseline must be at least 2x.
- **Demo runs against real testnet, not mock**: demo output includes the Plasma testnet block explorer link for at least one settled task. Reviewer manually verifies the link resolves to a real on-chain transaction.

## Out of Scope for Sprint 3

Explicit non-goals so we do not scope-creep:

- **Mainnet deploy**: Sprint 5+, gated on audit remediation and a separate go-live review.
- **Risc0 circuits**: Sprint 4. ServiceMarketplace `verifyProof` placeholder from Sprint 2 stays as-is.
- **Audit handoff**: Sprint 2 contracts only. No new contracts are introduced in Sprint 3, so no new audit work.
- **Dispute resolution arbitration agent**: still Phase 4.
- **Subgraph indexer**: nice-to-have but deferred unless e2e flakiness forces it for test stability.
- **Production-grade key management**: demo uses dev keys. Real KMS or Safe integration is Sprint 5.

## Dependencies on Sprint 2

Sprint 3 cannot start until Sprint 2 ships these:

- **Contracts deployed to Plasma testnet** by Sprint 3 start (2026-06-09). Deploy addresses written into `packages/sdk/src/config/chains.ts` as part of the Sprint 2 audit handoff.
- **Frozen ABIs** published in `packages/contracts/abi/` so viem type generation has a stable target. Any ABI churn after 2026-06-09 forces a regen and risks slipping the e2e gate.
- **Faucet wallet** funded with testnet USDT and gas, with a documented top-up procedure so e2e tests do not run dry mid-sprint.
- **Sprint 2 test suite green**: all Foundry unit, fuzz, and invariant tests passing on a clean clone. If Sprint 2 leaves any red, Sprint 3 inherits the risk that the on-chain semantics still drift from MockChain.

## Brand Rule

No em dashes. No "Web3" or "Web2" terminology. Use "crypto", "on-chain", "blockchain", or specific area names (DeFi, RWA, DePIN, Agentic Finance) where relevant.
