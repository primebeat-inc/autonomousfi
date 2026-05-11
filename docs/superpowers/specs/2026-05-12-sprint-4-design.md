# Sprint 4 Design Doc: Risc0 Reputation Circuit + Bench

**Date**: 2026-05-12
**Sprint Window**: 2026-06-23 to 2026-07-05
**Audience**: Engineers implementing zk reputation aggregation and PoP attestation in Risc0 zkVM, plus on-chain verifier integration
**Complements**: Phase 1 design spec (`docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md`), Sprint 2 contracts spec, Sprint 3 testnet deployment

## Sprint 4 Goal

Implement `reputation_aggregator` and `pop_attestation` circuits in Risc0 zkVM (Rust guest programs). Verify on testnet. Bench proving time.

The two guests are the cryptographic core of the Whuffie hybrid mechanism. `reputation_aggregator` proves that a claimed reputation score is the correct fixed-point aggregation of a private history of (counterparty, outcome, weight) tuples, exactly per spec section 7.1. `pop_attestation` proves that a claimed proof-of-personhood credential from zkPassport (the Sprint 4 adapter target) was issued by an accepted authority and binds to the prover's wallet address, without revealing the underlying credential.

Both guests emit public outputs that the on-chain Groth16 verifier checks. The Solidity verifier is generated from the Risc0 receipt, wired into `ReputationRegistry.sol` (Sprint 3 output) via a verifier interface. The same registry exposes `submitReputationProof` and `submitPopProof` entry points that accept the Risc0 seal bytes plus the public outputs.

This sprint produces a working zk pipeline end to end on testnet. No mainnet deploy. No zkML quality verification (that is Phase 5). No Worldcoin (that lands in Sprint 5 alongside zkPassport). The goal is one PoP authority, one reputation circuit, full proof, full verify, full bench.

## Window

- **Start**: 2026-06-23 (Tuesday, the week after Sprint 3 testnet contracts are live)
- **End**: 2026-07-05 (Sunday)
- **Working days**: 13
- **Buffer**: 2 days at end for Groth16 verifier integration debugging and gas tuning

## Sub-tasks

### cargo-risczero install and dev mode

Install the Risc0 toolchain on the M-series Mac dev box. Pin to a specific release tag in `rust-toolchain.toml`. Verify `cargo risczero --version` and `cargo risczero build --help` resolve. Set up `dev-mode` (no real proving, fast iteration) for the inner test loop, and `prove` mode for bench and final acceptance. Document the install procedure in `circuits/README.md` so any engineer can reproduce in under 30 minutes.

### reputation_aggregator guest (u32 fixed-point per spec sec 7.1)

Rust guest program at `circuits/reputation_aggregator/`. Reads a private input array of `(counterparty_id: u64, outcome: u8, weight_q16: u32)` tuples. Computes the weighted average per spec section 7.1, using u32 fixed-point with Q16.16 representation (16 integer bits, 16 fractional bits). Outcomes are 0 (negative), 1 (neutral), 2 (positive). Weights are clamped to a max so a single counterparty cannot dominate the aggregate.

Public outputs: claimed score (u32 Q16.16), history length (u32), Merkle root of the history tuples (so the host can later prove inclusion of a specific past interaction). The guest does NOT reveal individual tuples.

Edge cases the guest must handle: empty history (return score = neutral, root = zero), overflow protection on weighted sum, deterministic ordering so the Merkle root is stable across guest runs.

### pop_attestation guest (zkPassport adapter)

Rust guest program at `circuits/pop_attestation/`. Reads a private zkPassport credential blob plus the issuer public key. Verifies the credential signature inside the guest. Public outputs: wallet address binding (keccak256 of credential nullifier plus wallet address), issuer id (u32), expiration timestamp (u64).

The wallet address is committed publicly so the on-chain verifier can confirm "this proof binds to msg.sender". The nullifier is hashed before exposure so the same human cannot claim two PoP slots. Issuer id maps to an accepted-authorities registry on chain.

zkPassport adapter scope: just zkPassport for this sprint. Worldcoin and Civic come in Sprint 5 using the same guest interface.

### Risc0 host program

Rust host program at `circuits/host/`. CLI binary that takes JSON input (history file for reputation, credential file for PoP), invokes the appropriate guest, produces a receipt, serializes the seal and public outputs to the format expected by the on-chain verifier. Exposes `--mode dev|prove` flag. In dev mode skips the actual proving for fast iteration. Includes a `--bench` flag that emits timing data to stdout in a machine-parseable format.

### Solidity Groth16 verifier integration

Use `cargo risczero` to generate the Solidity verifier contract from the compiled guest images. Save as `contracts/RiscZeroVerifier.sol` (auto-generated, do not edit). Wire into Sprint 3's `ReputationRegistry.sol` via an `IRiscZeroVerifier` interface so the registry just calls `verifier.verify(seal, imageId, journalDigest)` for each submission.

Add two new entry points on `ReputationRegistry`: `submitReputationProof(bytes calldata seal, bytes32 historyRoot, uint32 score, uint32 historyLen)` and `submitPopProof(bytes calldata seal, uint32 issuerId, uint64 expiration, bytes32 nullifierHash)`. Each entry point: (1) calls the verifier, (2) reverts on bad proof, (3) updates state, (4) emits an event.

### Property-based tests for proof soundness

Use `proptest` crate. Generate random `(history, claimed_score)` pairs. Property: a proof verifies on chain if and only if `claimed_score` matches the canonical aggregation of `history` per spec section 7.1. Run at minimum 1000 iterations in CI. Similar property test for `pop_attestation`: a proof verifies iff the credential signature is valid AND the nullifier hash is computed correctly.

These tests run in dev mode (no real proving) for speed. Real-proof verification is exercised in a separate slow integration test that runs 5 cases overnight in CI.

### Bench: <60s prove time for N=100 history

Bench harness at `circuits/bench/`. Measures wall clock time for `reputation_aggregator` proving with history length N=100, on a 2025 M3 Max Mac with 64GB RAM (the canonical dev box). Acceptance: under 60 seconds median across 10 runs.

Also bench `pop_attestation`: target under 30 seconds (no aggregation, just signature check, so it should be faster). Output a markdown report to `circuits/bench/RESULTS.md` with median, p95, p99, and gas cost for on-chain verify.

## Acceptance gates

- **Coverage**: 95% line coverage on the Rust guest code via `cargo-llvm-cov`. 100% coverage of the public output emission path (every public commit point must be exercised). Coverage measured in dev mode.
- **Property tests**: 1000+ runs of the soundness property test without counterexample. Documented seed for reproducibility.
- **Bench**: median proving time under 60s for `reputation_aggregator` at N=100 on the M-series dev box. Median under 30s for `pop_attestation`. p95 under 90s and 45s respectively.
- **On-chain gas**: Groth16 verify under 250K gas per call. Measured via Foundry gas snapshot on `ReputationRegistry.submitReputationProof`.
- **Testnet integration**: a full end-to-end flow runs on the Sprint 3 testnet: host produces a proof, submits via `submitReputationProof`, the registry verifies and updates state, an event fires. Captured as a recorded transaction hash in the sprint retro.

## Out of scope

- **zkML quality verification**: zkML proofs over off-chain ML outputs is Phase 5 work. The reputation aggregator here aggregates outcome bits, not ML scores.
- **Worldcoin integration**: lands in Sprint 5 alongside zkPassport using the same `pop_attestation` guest interface (different issuer id, different signature scheme adapter).
- **zk audit**: a separate Sprint after audit firm engagement. We produce audit-ready Rust guest code in this sprint, but do not engage an auditor until the full circuit suite is stable.
- **Multi-credential PoP composition**: requiring two PoP sources (e.g. zkPassport + Civic) on a single attestation is a future enhancement, not in scope.
- **Recursive proofs / proof aggregation**: not needed for the testnet flow. May be revisited if mainnet gas cost forces it.

## Dependencies

- **Sprint 3 testnet contracts deployed**: `ReputationRegistry.sol` from Sprint 3 must be live on the chosen testnet (Plasma or fallback) with the verifier interface stub in place. Sprint 4 wires the real verifier into that stub.
- **Risc0 toolchain installed locally**: cargo-risczero pinned to a release tag, `risc0-zkvm` crate version aligned, M-series Mac with at least 64GB RAM for proving. CI runner provisioned with the same toolchain for property tests in dev mode (real proving runs on the dev box, not CI).
- **zkPassport credential test vectors**: at least 5 sample credentials with known-valid signatures, sourced from the zkPassport docs or a friendly contact at the project. These drive the `pop_attestation` integration tests.
- **Foundry workspace from Sprint 2**: the Solidity verifier wires into the existing Foundry project, so the Sprint 2 build must remain green on the main branch.
