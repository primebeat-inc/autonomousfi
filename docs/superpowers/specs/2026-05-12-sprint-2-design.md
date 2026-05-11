# Sprint 2 Design Doc: Solidity Contracts Production Implementation

**Date**: 2026-05-12
**Sprint Window**: 2026-05-26 to 2026-06-07 (12 days, after AUTON keynote settles)
**Audience**: Engineers implementing EscrowVault / HostageBond / ServiceMarketplace on Plasma testnet
**Complements**: Phase 1 design spec (`docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md`)

## Sprint 2 Goal

Implement production-grade Solidity contracts for EscrowVault, HostageBond, ServiceMarketplace on Plasma testnet. Match the TypeScript MockChain semantics exactly so the SDK swap from mock to chain is a one-line config change.

The binding semantic spec is `packages/sdk/src/mock-chain.ts`. Every state transition, every error code, every event must mirror MockChain. If MockChain says "lock funds atomically with stake", Solidity does the same. If a behavior diverges, MockChain is wrong and gets updated first, then Solidity follows.

This sprint produces audit-ready code. No mainnet deploy. No Risc0 wiring. No dispute resolution agent. Just three rock-solid contracts with full Foundry coverage and static analysis green.

## Window

- **Start**: 2026-05-26 (Tuesday after AUTON keynote on 5/17 has settled and post-event follow-ups are wrapped)
- **End**: 2026-06-07 (Sunday)
- **Working days**: 12
- **Buffer**: 2 days for audit prep handoff at the end

## Contracts in Scope

### EscrowVault.sol

ERC20-locked escrow with timeout. Holds requester funds until the ServiceMarketplace orchestrator instructs release or refund.

**Functions**:
- `lock(address requester, address provider, bytes32 taskHash, uint256 amount, uint256 deadline)`: pulls ERC20 from requester via `transferFrom`, records escrow state, emits `EscrowLocked`.
- `release(bytes32 taskHash)`: transfers funds to provider, sets status to Released, emits `EscrowReleased`. Operator-only.
- `refund(bytes32 taskHash)`: returns funds to requester after deadline, sets status to Refunded, emits `EscrowRefunded`. Callable by anyone after deadline.
- `getStatus(bytes32 taskHash) returns (Status)`: view.

**Status enum**: `Locked / Released / Refunded`

**Errors**:
- `UnknownTask(bytes32 taskHash)`
- `AlreadyReleased(bytes32 taskHash)`
- `AlreadyRefunded(bytes32 taskHash)`
- `InsufficientApproval(uint256 required, uint256 actual)`
- `DeadlineNotReached(uint256 deadline, uint256 nowTs)`

**Security**:
- ReentrancyGuard on all state-changing functions
- AccessControl with `OPERATOR_ROLE` (only ServiceMarketplace can call `lock` and `release`)
- `refund` is permissionless after deadline so requester is not locked out by operator failure
- SafeERC20 wrappers for all token transfers
- No upgrade path on V1 (immutable, see Q2)

**Events**:
- `EscrowLocked(bytes32 indexed taskHash, address requester, address provider, uint256 amount, uint256 deadline)`
- `EscrowReleased(bytes32 indexed taskHash, address provider, uint256 amount)`
- `EscrowRefunded(bytes32 indexed taskHash, address requester, uint256 amount)`

### HostageBond.sol

ERC20-locked stake from the provider, with slash-to-recipient or refund-to-provider as the resolution paths.

**Functions**:
- `stake(bytes32 taskHash, address provider, uint256 amount)`: pulls ERC20 from provider, records stake, emits `BondStaked`. Operator-only.
- `refund(bytes32 taskHash)`: returns stake to provider on honest settlement. Operator-only.
- `slash(bytes32 taskHash, address recipient)`: transfers stake to recipient on dispute resolution against provider. Operator-only.
- `getStatus(bytes32 taskHash) returns (Status)`: view.

**Status enum**: `Staked / Refunded / Slashed`

**Errors** (mirror MockChain):
- `UnknownTask(bytes32 taskHash)`
- `HostageAlreadyResolved(bytes32 taskHash)`

**Security**:
- ReentrancyGuard
- AccessControl with `OPERATOR_ROLE` (only ServiceMarketplace)
- SafeERC20
- Immutable V1
- No anyone-can-refund escape hatch on V1: bond resolution is always operator-driven because slashing requires dispute outcome. If operator fails permanently, governance migration handles it (out of scope for Sprint 2).

**Events**:
- `BondStaked(bytes32 indexed taskHash, address provider, uint256 amount)`
- `BondRefunded(bytes32 indexed taskHash, address provider, uint256 amount)`
- `BondSlashed(bytes32 indexed taskHash, address recipient, uint256 amount)`

### ServiceMarketplace.sol

Orchestrator that calls EscrowVault and HostageBond in lockstep. The state machine lives here. Every transition emits an event for the off-chain indexer.

**Functions**:
- `createTask(address provider, uint256 price, uint256 stake, bytes32 qualityHash, uint256 deadline) returns (bytes32 taskHash)`: requester locks `price` in EscrowVault, emits `TaskCreated`. Task is in `Pending` state.
- `acceptTask(bytes32 taskHash)`: provider stakes `stake` in HostageBond, emits `TaskAccepted`. Transitions to `Active`.
- `submitResult(bytes32 taskHash, bytes32 resultHash)`: provider submits result hash, emits `ResultSubmitted`. Transitions to `Submitted`.
- `settle(bytes32 taskHash)`: releases escrow to provider and refunds bond to provider, emits `TaskSettled`. Callable by requester or after dispute window passes. Transitions to `Settled`.
- `dispute(bytes32 taskHash, bytes32 reason)`: requester raises dispute within dispute window, emits `TaskDisputed`. Transitions to `Disputed`. Resolution is out of scope for Sprint 2 (handled by Phase 4 arbitration agent), but the dispute branch must wire through to allow slash + refund manually by `ADMIN_ROLE` in Sprint 2 for testing.

**Task state machine**: `Pending → Active → Submitted → Settled` (happy path) or `Submitted → Disputed → (Slashed | Settled)` (dispute path)

**Security**:
- AccessControl with `OPERATOR_ROLE` for EscrowVault and HostageBond (granted to ServiceMarketplace at deploy)
- `ADMIN_ROLE` for emergency dispute resolution in Sprint 2 (replaced by arbitration agent in Phase 4)
- ReentrancyGuard on all entry points
- CEI pattern enforced: state writes before external calls
- Per-task struct held in storage mapping; never reads from external contracts mid-transition

**Events** (every state transition):
- `TaskCreated(bytes32 indexed taskHash, address indexed requester, address indexed provider, uint256 price, uint256 stake, bytes32 qualityHash, uint256 deadline)`
- `TaskAccepted(bytes32 indexed taskHash, address indexed provider)`
- `ResultSubmitted(bytes32 indexed taskHash, bytes32 resultHash)`
- `TaskSettled(bytes32 indexed taskHash)`
- `TaskDisputed(bytes32 indexed taskHash, address indexed disputer, bytes32 reason)`

## Test Gates

All gates must be green to close Sprint 2. No exceptions, no "we'll fix it in audit prep".

- **Foundry unit tests**: `forge test` with 100% line coverage, 95% branch coverage. Report from `forge coverage --report lcov`.
- **Fuzz tests**: 1M+ runs per stateful function (`forge test --fuzz-runs 1000000`). Properties to fuzz: amount, deadline, taskHash, role permissions.
- **Invariant tests**: 256 runs depth 32 (`forge test --invariant-runs 256 --invariant-depth 32`). Funds-conservation invariant: for any taskHash, `escrow.balance + bond.balance + paidOut = totalLocked`. This mirrors MockChain invariant I1 in `packages/sdk/src/invariants.ts`.
- **Static analysis**: Slither and Mythril clean on every PR via CI. No medium-or-higher findings allowed to merge.
- **Gas snapshots**: `forge snapshot` committed; PRs that regress gas by >10% require review justification.

## Audit Prep

By end of Sprint 2, prepare for external audit. Single firm initially for Solidity (Trail of Bits, Spearbit, or OpenZeppelin). ZK audit firm engaged separately in Sprint 4 once Risc0 circuits exist.

**Budget**: $30K to $50K for Solidity audit, lead time 6 to 10 weeks. Engagement letter signed during Sprint 3.

**Funding source**: Two options being explored in parallel:
1. Tether co-development partnership (since contracts live on Plasma, USDT is the settlement asset)
2. Ethereum Foundation Privacy & Scaling Explorations grant proposal (linked to Open Question OQ-11 in the Phase 1 spec)

**Deliverables for audit handoff** at end of Sprint 2:
- Frozen contract source with no pending changes
- README with architecture diagram, role model, state machines
- Threat model document covering trust assumptions, attacker model, known limitations
- Full Foundry test suite passing on a clean clone
- Slither + Mythril reports archived
- Gas snapshot baseline

## Out of Scope for Sprint 2

Explicit non-goals so we do not scope-creep:

- **Risc0 circuit deploy**: Sprint 4. ServiceMarketplace has a placeholder for `verifyProof(bytes proof)` that returns `true` in V1.
- **Mainnet deploy**: Sprint 6 at earliest, gated on audit completion and remediation.
- **Dispute resolution arbitration agent**: Phase 4. Sprint 2 uses an `ADMIN_ROLE` manual override for testing dispute paths.
- **ERC20 token deploy**: Not needed. The USDT bridge address on Plasma testnet is used directly. SDK config reads token address from chain config.
- **UI / dashboard**: Sprint 3.
- **Subgraph indexer**: Sprint 3, after events are stable.
- **Upgradeable proxy**: See Q2. Default plan is immutable V1.

## Open Questions for Sprint 2 Kickoff

These must be resolved on the Day 1 kickoff call (2026-05-26). Owners assigned during the call. Decisions go into the ADR log at `docs/adr/`.

**Q1: Plasma testnet RPC provider**
- Option A: Official Tether endpoint
- Option B: Infura or Alchemy if they support Plasma
- Trade-off: Tether endpoint may have rate limits or instability; third-party providers add latency and another trust dependency
- Owner: TBD on kickoff
- Default if no decision: official Tether endpoint with a fallback URL in the SDK config

**Q2: ServiceMarketplace upgradeability**
- Option A: Upgradeable proxy (UUPS or Transparent Proxy)
- Option B: Immutable, redeploy with migration on V2
- Trade-off: Upgradeable adds attack surface (proxy admin keys, storage layout) and ~30% audit cost increase. Immutable forces clean redeploys but makes any post-audit bug fix a migration project.
- Owner: TBD
- Default if no decision: immutable V1. Migration tooling deferred to Phase 3.

**Q3: ERC20 approval flow**
- Option A: Explicit `approve` + `lock` (two transactions)
- Option B: ERC-2612 `permit` (single transaction with signed message)
- Trade-off: Permit is better UX and lower gas, but USDT on Plasma may not implement ERC-2612 natively. If USDT lacks permit, we fall back to approve.
- Owner: TBD
- Default if no decision: support both. Permit path is a fast-path; approve+lock is the always-available path.

**Q4: Operator role**
- Option A: ServiceMarketplace alone holds `OPERATOR_ROLE` on EscrowVault and HostageBond
- Option B: ServiceMarketplace plus a Safe multisig as admin escape hatch
- Trade-off: Safe multisig adds an emergency recovery path (pause, migrate) but also adds a centralized control point that auditors will flag.
- Owner: TBD
- Default if no decision: ServiceMarketplace alone for V1. A Safe multisig holds `DEFAULT_ADMIN_ROLE` for role management only, not for direct operator actions.

## Dependencies on Sprint 1

Sprint 2 builds directly on Sprint 1 deliverables. If these are not green by 2026-05-25, Sprint 2 cannot start.

- **`@autonomousfi/sdk` MockChain interface is the binding semantic spec** (`packages/sdk/src/mock-chain.ts`). Every Solidity function signature, error, event, and state transition must match MockChain. Where Solidity is forced to diverge (gas, type widths), MockChain gets updated first to keep the spec authoritative.
- **All error codes** (`packages/sdk/src/errors.ts`) must have a matching Solidity custom error with the same name and same argument shape. The integration test suite asserts that ethers.js error decoding produces the same string as MockChain throws.
- **MockChain invariant suite** (`packages/sdk/src/invariants.ts`) is ported to Foundry invariant tests. The Sprint 2 test suite must include at minimum I1 (funds conservation), I2 (no double-release), I3 (no double-slash).
- **Event signatures**: every event in MockChain has a Solidity counterpart with the same indexed fields and the same argument order.

## Brand Rule

No em dashes. No "Web3" or "Web2" terminology. Use "crypto", "on-chain", "blockchain", or specific area names (DeFi, RWA, DePIN, Agentic Finance) where relevant.
