# ADR 0002: MockChain as Binding Semantic Spec

## Status

Accepted 2026-05-12

## Context

Solidity contract implementation is scheduled for Sprint 2, but the SDK needs a working backend in Sprint 1 to ship the AUTON demo on time. Waiting for production contracts before exercising the SDK would block the demo and delay end-to-end integration validation.

We also need to lock execution semantics before contract writers join the project. Without a precise reference, contract authors would have to infer behavior from prose documentation, which historically produces drift between specification and implementation. Discrepancies discovered late in Sprint 2 would force expensive rework on both the SDK and the contracts.

The SDK already requires an in-memory backend for fast unit tests and offline development. Promoting that backend from a convenience to a binding specification costs little extra and gives the team a single source of truth for behavior.

## Decision

The in-memory MockChain in `packages/sdk/src/mock-chain.ts` is the binding semantic specification for AutonomousFi execution.

Concretely:

1. Every behavior the SDK relies on must be implemented and tested in MockChain first. The MockChain test suite (`mock-chain.test.ts`) is the canonical behavior contract.
2. Solidity contracts in Sprint 2 must replicate MockChain behavior one-to-one. Where Solidity-specific concerns (gas, reverts, storage layout) require deviation, deviations must be documented as ADR amendments, not silent divergence.
3. Foundry tests for the Solidity contracts must mirror `mock-chain.test.ts` case for case. A divergence in a mirrored test is a defect in either MockChain or the contract, never an accepted gap.
4. When SDK consumers report behavior bugs, the fix lands in MockChain and its test suite first. Contract changes follow.

## Consequences

### Positive

- The SDK is stable in Sprint 1 because its backend is real code under test, not a stub waiting for contracts.
- The AUTON demo works offline. No RPC, no testnet flakiness, no key management required for the live walkthrough.
- Contract authors get a deterministic fixture to validate against. Foundry tests have a target, not a prose description.
- Semantic disagreements surface early. If MockChain and the contracts diverge, the mirrored test suite catches it before integration.
- The behavior contract has executable tests rather than a document that drifts.

### Negative

- MockChain limitations leak through to early SDK adopters. There is no concurrent transaction ordering, no mempool, no reorg behavior. Adopters who build against MockChain may write code that breaks on a real chain.
- On-chain event semantics (log topics, indexed parameters, ABI encoding nuances) are not exercised until Sprint 2. Bugs in event shape will be discovered late.
- Gas costs, revert reasons, and storage layout cannot be validated against MockChain. Those concerns ride entirely on Sprint 2 Foundry work.
- Treating MockChain as the spec means changes to MockChain are effectively spec changes and need the same review rigor as a contract change. The team must resist the temptation to "just patch the mock."
