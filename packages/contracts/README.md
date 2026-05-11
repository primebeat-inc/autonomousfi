# AutonomousFi Contracts

Production-grade Solidity implementation for the AutonomousFi protocol. Sprint 2 begins active development in this directory.

## Scope

Sprint 1 (current cycle) sets up the Foundry scaffold only. No Solidity source files are written yet. Sprint 2 first commit will run `forge install` and ship the initial contract drafts.

## Planned Contracts (Sprint 2)

The following 5 contracts will be implemented:

1. **EscrowVault**: holds funds in escrow for service agreements between agents and clients. Handles deposit, release, refund, and dispute-triggered freeze.
2. **HostageBond**: hostage capital mechanism. Agents lock collateral that can be slashed on misbehavior, creating skin-in-the-game commitment.
3. **ReputationRegistry**: on-chain reputation scoring tied to verified service completions. Append-only ledger of attestations with weighted decay.
4. **PoPVerifier**: Proof-of-Personhood verifier. Validates that an address has passed an off-chain identity gate (e.g., World ID, Anon Aadhaar) before allowing high-trust actions.
5. **ServiceMarketplace**: top-level orchestrator. Routes service requests, instantiates escrow, locks bonds, gates by reputation and PoP, settles payments.

## Audit Plan

The following firms are under consideration for the Solidity audit prior to mainnet deployment:

- Trail of Bits
- Spearbit
- OpenZeppelin

Final selection happens at end of Sprint 4 once contract surface is frozen.

## Test Gates

All contracts must clear the following before mainnet deployment:

- 100% line coverage
- 95% branch coverage
- 1,000,000+ fuzz runs per invariant
- Property tests for every state-transition function
- Differential tests against reference implementations where applicable

## Setup

Sprint 2 first commit runs:

```
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

This cycle does NOT execute `forge install`. The `lib/` directory will be created at that point.

## Layout

```
packages/contracts/
  foundry.toml       Foundry configuration
  remappings.txt     Import remappings for forge-std and OpenZeppelin
  .gitignore         Excludes out/, cache/, broadcast/, lib/
  src/               Solidity sources (filled in Sprint 2)
  test/              Foundry tests (filled in Sprint 2)
  script/            Deployment scripts (filled in Sprint 2)
```

## Sprint Cadence

| Sprint | Deliverable |
|--------|-------------|
| 1 | Scaffold only (this cycle) |
| 2 | First contract drafts, unit tests, CI wired |
| 3 | Invariant tests, fuzz campaigns, gas optimization |
| 4 | Audit prep, freeze, external audit kickoff |
| 5 | Audit fix-up, deployment scripts, mainnet rehearsal |
