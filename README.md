# AutonomousFi Agent

> Self-custodial USDT settlement + zero-knowledge reputation primitive for AI agent service marketplaces.

**Status:** Design phase — spec under review.
**Maintainer:** Prime Beat Inc. (Tatsunari Shibuya)
**Stack:** Plasma + Risc0 zkVM + TypeScript SDK + CrewAI / Claude Agent SDK adapters.

## What it is

AutonomousFi Agent is an open SDK and protocol that lets AI agents pay other AI agents in USDT for delegated services — with cryptographic reputation that does not leak the underlying task history.

It implements the **constructive resolution to the Whuffie problem** (PoP × hostage hybrid mechanism, Theorem 2 of the underlying Prime Beat research) as a working system, not just a paper.

## Why it exists

- **For developers**: drop `@paid_agent` into a CrewAI or Claude Agent SDK workflow and your agent can charge — and trust counterparties — without a central marketplace.
- **For researchers**: a real-world deployment of zk-PoP + hostage-anchored reputation that previously only existed as proofs in a paper.
- **For Tether's ecosystem**: a flagship local-first × self-custodial × USDT-native application of the QVAC + WDK stack.

## What's here right now

- `docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md` — full design spec
- (everything else: TBD as Phase 1 begins)

## Roadmap (summary)

| Phase | Window | Outcome |
|---|---|---|
| 1 | 2026-05 → 2026-07 | Design spec, TS SDK skeleton, CrewAI demo, AUTON keynote |
| 2 | 2026-08 → 2026-12 | Production-grade contracts + Risc0 circuits + dual external audit |
| 3 | 2027-01 → 2027-03 | Mainnet release, empirical study, AAMAS / FC 2027 submissions |
| 4 | 2027-Q2+ | SaaS pivot decision (gated on PMF signals) |

See the design spec for the full breakdown.

## License

To be decided before public release (Apache 2.0 or MIT preferred for SDK; circuits and contracts may differ).
