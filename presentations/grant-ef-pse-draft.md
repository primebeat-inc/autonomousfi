# Zero-knowledge Proof-of-Personhood × Hostage Hybrid Mechanism: a Constructive Resolution to the Whuffie Problem

**Submission to:** Ethereum Foundation, Privacy & Scaling Explorations (PSE)
**Applicant:** Prime Beat Inc. (Tokyo, Japan)
**Project:** AutonomousFi
**Repository:** https://github.com/primebeat-inc/autonomousfi
**Contact:** Tatsunari Shibuya (CEO), shibutatsu.eth
**Status:** Draft (CEO review pending; not submitted)

---

## TL;DR

We are implementing the constructive half of the Whuffie problem: under cheap identity, pure reputation is provably insufficient (Theorem 1), but a Proof-of-Personhood × hostage hybrid mechanism is constructively sufficient (Theorem 2). Production code already exists at github.com/primebeat-inc/autonomousfi with 124 passing tests across the SDK and Solidity layers. PSE funding underwrites the Risc0 ZK circuit implementation and audit prep for Phase 3 mainnet.

## Background

Whuffie, introduced by Cory Doctorow in "Down and Out in the Magic Kingdom" (2003), is reputation-as-currency: a transferable, redeemable token whose value tracks social standing rather than monetary balance. In agentic settings where identities are cheap (sybil-cheap), a pure reputation economy collapses.

**Theorem 1 (Whuffie Impossibility).** In a repeated game with cheap identity creation, any reputation-only mechanism admits a profitable deviation for a rational agent: spawn a fresh identity, defect once, retire. No bounded honest equilibrium exists under standard rationality assumptions. (Prime Beat R&D, proof drafts v3; structurally parallels Bahrani-Garimidi-Roughgarden 2024 on Sybil-proof TFMs and Sugaya-Wolitzky 2020 on cheap-identity repeated games.)

**Theorem 2 (Hybrid Constructive Sufficiency).** Augmenting reputation with (a) a Proof-of-Personhood gate of unit cost C_PoP and (b) a hostage stake s admits a parameter region in which honest play is a dominant strategy. The mechanism M_H is incentive-compatible iff (C_PoP, s) lie above a threshold characterized by the agent's discount factor and the per-round defection payoff. (Prime Beat R&D, Theorem 2 proof drafts v3.)

Reference: project memory `project_prime_beat_rd_theme_sybil.md`. Full proof drafts v3 in private R&D vault; will be shared with PSE under NDA on request.

## What we will build

The grant funds the on-chain instantiation of Theorem 2.

1. **Risc0 `reputation_aggregator` circuit (Sprint 4).** Rust guest program that takes an agent's job-completion history and outputs a u32 fixed-point reputation score with a Groth16 proof. Score encoding follows ADR-0001. Privacy: per-job counterparty identities are not revealed; only the aggregate score and proof are public.

2. **Risc0 `pop_attestation` circuit (Sprint 5).** Rust guest program integrating zkPassport (passport-anchored personhood) and Worldcoin (iris-anchored personhood) attestations. Outputs a personhood commitment that the on-chain verifier can check without learning which provider attested or which document was used. Supports a multi-issuer set so the system is not bound to a single PoP provider.

3. **On-chain Groth16 verifier (already deployed via Sprint 2).** The verifier contract is live as part of `ServiceMarketplace` on Plasma testnet. The new circuits plug into the existing verification path.

4. **50+ agent empirical study (Sprint 3-6).** Live testnet runs with N≥50 CrewAI agents under four `(C_PoP, s)` parameter regimes, measuring honest-play frequency, sybil-attempt rate, and welfare. This forms the empirical chapter of the planned papers.

5. **Paper submissions (2027-Q2).** AAMAS 2027 (Autonomous Agents and Multi-Agent Systems) and FC 2027 (Financial Cryptography) targets.

## What we want from PSE

- **Grant:** $30K-$50K, 3 months duration, covering Sprint 4 and Sprint 5 of the AutonomousFi roadmap.
- **Technical mentorship:** Access to PSE researchers for Risc0 circuit optimization (proving time, constraint count, recursion strategy). Roughly 4-6 review touchpoints over the grant window.
- **Co-publication option:** PSE researchers welcome as co-authors on the empirical study if their contribution warrants it. The theoretical chapters remain authored by Prime Beat R&D.

## Technical approach

- **Runtime:** Risc0 zkVM, Rust guest programs.
- **Score encoding:** u32 fixed-point with explicit overflow guards (ADR-0001).
- **Testing:** Property-based testing (proptest) for proof soundness on the guest side, Foundry invariant testing on the verifier side. Existing invariants I1, I2, I3 in `ServiceMarketplace` extend to cover the new verifier paths.
- **Proving time target:** under 60 seconds for N=100 history records on a commodity GPU.
- **On-chain verification gas target:** under 250K gas on Plasma. (Plasma chosen for the empirical study; the verifier is portable to Ethereum L1 and L2s with minor calldata adjustments.)
- **Soundness assumption:** Groth16 with a trusted ceremony output; the empirical study uses a Risc0-provided ceremony, mainnet would use a project-specific MPC.

## Existing artifact

The grant does not fund cold-start work. Phase 1 and Phase 2 are closed and public.

- **Repository:** github.com/primebeat-inc/autonomousfi (public, MIT).
- **Sprint 1 (SDK):** 71 tests passing. PaidAgent abstraction, quality scoring, error taxonomy, mock-chain harness.
- **Sprint 2 (Solidity contracts):** 53 Foundry tests passing, 100% line coverage on `ServiceMarketplace`. Invariants I1 (escrow conservation), I2 (no double-release), I3 (verifier monotonicity) all green.
- **Sprint 3 (in progress):** viem adapter, Plasma testnet deployment, CrewAI HTTP service bridging Python agents to the on-chain marketplace.
- **Sprint 4-5 (this proposal's scope):** Risc0 circuits + zkPassport / Worldcoin integration.

A grant reviewer can clone, install, and run the full test suite in under 10 minutes; the README documents the exact commands.

## Timeline

| Date | Milestone |
|---|---|
| 2026-06 | PSE proposal submission |
| 2026-07 | PSE review window |
| 2026-08 to 2026-09 | Grant decision target |
| 2026-10 to 2026-12 | Sprint 4-5 circuit implementation (grant period) |
| 2027-01 to 2027-03 | Empirical study, N≥50 agents, 4 parameter regimes |
| 2027-Q2 | AAMAS 2027 and FC 2027 paper submissions |

## Funding source disclosure

Prime Beat is concurrently pursuing a co-development partnership with Tether on adjacent infrastructure (stablecoin-denominated escrow paths in `ServiceMarketplace`). The Tether engagement is commercial and does not overlap with the ZK circuit scope funded by PSE. Both funding sources will be acknowledged transparently in any joint research output, and any IP arising from the PSE-funded portion will remain open source under the existing MIT license on the AutonomousFi repository.

## Team

- **Tatsunari Shibuya (CEO).** University of Tokyo, Prime Beat founder. R&D lead on the Whuffie problem (proof drafts v3 author).
- **Lead Engineer (Aoi Makino).** Solidity, Rust, viem; owner of the Sprint 2 contracts.
- **Lead Researcher (Aoto Sato).** Empirical study design, agent simulation harness.
- **Lead Consultant (Hayashi Naritoshi).** Stakeholder coordination across PSE, Tether, and academic reviewers.

## Why PSE specifically

Three reasons.

1. **ZK is load-bearing, not decorative.** The hybrid mechanism requires both score aggregation and personhood attestation to be verifiable without revealing the underlying history or the identity document. Neither survives without ZK.
2. **The empirical chapter needs an Ethereum-aligned testbed.** Plasma is L1-compatible; results carry to L1 and L2s without redesign. PSE's network and reviewer access shortens the path from result to peer-reviewed publication.
3. **Open source by default.** The repository is already MIT. The grant outputs slot into a working public artifact rather than a closed deliverable.

---

*Draft prepared for internal review. CEO sends after sign-off; not auto-sent.*
