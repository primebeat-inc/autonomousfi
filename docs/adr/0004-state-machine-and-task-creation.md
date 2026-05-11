# ADR 0004: State machine and atomic task creation

## Status

Accepted (2026-05-12), to be incorporated into Sprint 2 design doc rewrite.

## Context

The Sprint 2 design doc (`docs/superpowers/specs/2026-05-12-sprint-2-design.md` line 90-95) describes a `Pending -> Active -> Submitted -> Settled` state machine with a separate `acceptTask` function where the provider stakes hostage. The already-committed `IServiceMarketplace.sol` interface (commit `9de05c6`) instead exposes:

- enum `TaskStatus { Unknown, Created, Submitted, Settled, Slashed, Disputed }`
- atomic `createTask(provider, taskHash, price, stake, qualityHash, deadline)` that locks escrow and stakes hostage in one transaction
- no separate `acceptTask`

The Sprint 2 plan must follow exactly one of these. The divergence cannot be left for the implementer to resolve mid-sprint.

## Decision

Adopt the `IServiceMarketplace.sol` interface as canonical. Update the Sprint 2 design doc in a follow-up commit to match.

## Rationale

1. **Matches MockChain semantics exactly.** MockChain has no `accept` step; lock and stake are independent operations called in sequence by the orchestrator. ServiceMarketplace as the on-chain orchestrator does the same in one transaction.
2. **No partial-state leak.** A `Pending` state where escrow is locked but hostage is not yet staked has the same class of risk as the impl-throws case fixed in `paid-agent.ts` commit `d81e13b`. Atomic creation closes that gap by construction.
3. **Fewer transactions.** One on-chain transaction per task creation instead of two reduces gas cost and removes a UX wait state.
4. **Smaller state machine.** 5 productive states (`Created / Submitted / Settled / Slashed / Disputed`) is the minimum needed to encode the happy path plus dispute fork. Fewer states means smaller audit surface.

## Consequences

### Positive

- Atomic settle/slash. No need to handle "what if accept never happens" timeouts at the state machine level (that case is now "createTask never happens", which is no state at all).
- Simpler state encoding. Fewer transitions to test.
- Matches the SDK paid-agent flow already implemented in Sprint 1.

### Negative

- Provider must pre-approve the HostageBond contract before any requester can name them as provider in a `createTask` call. This requires a one-time approval step at provider onboarding. Phase 5 PoP-gated registration will bundle this approval into the onboarding flow.
- Requester needs to know provider's identity off-chain before submitting `createTask`. This matches the SDK design (requester explicitly passes `providerAddress` to `paidAgent`) so it is not a new constraint.

## Follow-up

- Sprint 2 design doc (`2026-05-12-sprint-2-design.md`) updated in a chore commit to remove the `acceptTask` description and rename `Pending / Active` to `Created`.
- Sprint 5 PoP-gated registration adds the one-time provider approval step to the onboarding flow.
- This ADR is referenced from Sprint 2 plan Task 0 Step 1.
