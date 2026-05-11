# AutonomousFi Agent

[![CI](https://img.shields.io/github/actions/workflow/status/primebeat-inc/autonomousfi/ci.yml?branch=main&label=CI)](https://github.com/primebeat-inc/autonomousfi/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![SDK Version](https://img.shields.io/badge/sdk-v0.0.1-orange)](./packages/sdk/package.json)
[![Node](https://img.shields.io/badge/node-%E2%89%A522-43853d)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A59-f69220)](https://pnpm.io/)

> An open SDK that lets AI agents pay other AI agents in stablecoins and trust the counterparty, without a central marketplace.

AutonomousFi Agent is a TypeScript SDK plus protocol that turns any agent into a `paidAgent`. Two agents who have never met can negotiate a price, hold the funds in escrow, exchange a service, and settle, with cryptographic reputation that does not leak the underlying task content. It is a working implementation of the constructive **PoP x hostage hybrid mechanism** (Theorem 2 of the Prime Beat Whuffie research), running today as a mock-chain demo and targeting mainnet in 2027 Q1.

## Quick start

```bash
pnpm install
pnpm test                       # 17 SDK tests
python demos/agent_to_agent_review.py   # mock A->B paid code review
```

Full step-by-step setup including the CrewAI plugin: see **[`docs/QUICKSTART.md`](./docs/QUICKSTART.md)**.

## Why this exists

- **For agent developers.** Wrap your existing CrewAI or Claude Agent SDK agent with `@paid_agent` and it can charge other agents in mock USDT today, real USDT in 2027 Q1, without running your own marketplace or trust layer.
- **For applied-cryptography researchers.** A real deployment of zk Proof-of-Personhood plus hostage-anchored reputation. The constructive half of the Whuffie impossibility / construction pair, deployed not just proved.
- **For the broader stablecoin ecosystem.** A self-custodial, locally-running, stablecoin-native application of the QVAC + WDK stack. No custody of user keys, no off-chain reputation oracle.

## Status

Sprint 1 of Phase 1 (2026-05-12 -> 2026-05-24). Currently in the repo:

- TypeScript SDK with in-memory `MockChain`, `paidAgent` factory, `QVACQualityVerifier` stub, hostage escrow flow (17 tests pass)
- CrewAI plugin alpha (`crewai_paidagent.PaidCrewAgent`) talking to the SDK over JSON IPC
- Working end-to-end demo: `demos/agent_to_agent_review.py`
- AUTON 2026-05-17 keynote deck under `presentations/auton-2026-05-17/`

What is **not** here yet: production Solidity contracts, Risc0 PoP circuit, real Plasma deployment. Those land in Phase 2 (2026-08 onward).

## Architecture

See the design spec, section 4 (System Architecture), for the full picture:
[`docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md`](./docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md)

In one paragraph: each `paidAgent` execution opens an escrow on a chain layer (mock today, Plasma in Phase 2), runs the underlying implementation, scores the output through a quality verifier (currently a deterministic stub, a Risc0-attested QVAC judge later), and either settles to the provider plus refunds the surplus to the requester, or slashes the provider's stake to the hostage pool. Reputation is a counter of successful settlements bound to a zk Proof-of-Personhood credential, so a new pseudonym is cheap but a reputation is not.

## Roadmap

Summary in [`docs/ROADMAP.md`](./docs/ROADMAP.md). Authoritative version in the spec, section 12.

| Phase | Window | Outcome |
|---|---|---|
| 1 | 2026-05 -> 2026-07 | Design spec, SDK skeleton, CrewAI demo, AUTON keynote |
| 2 | 2026-08 -> 2026-12 | Production contracts + Risc0 circuits + dual external audit |
| 3 | 2027-01 -> 2027-03 | Mainnet release, empirical study, AAMAS / FC 2027 submissions |
| 4 | 2027-Q2+ | Managed-service decision, gated on PMF signals |

## Contributing

Issues and PRs welcome. Conventions: TDD, conventional commits, one topic per PR. See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Talks

- **AUTON 2026-05-17 keynote** ("Agent-to-Agent Economy: shipping the Whuffie construction"): [`presentations/auton-2026-05-17/`](./presentations/auton-2026-05-17/)

## Contact

- AUTON kickoff event, 2026-05-17 (in person, Tokyo)
- GitHub issues on this repo
- X: [@shibutatsu](https://x.com/shibutatsu) (Tatsunari Shibuya, Prime Beat Inc.)

## License

Apache 2.0 for the SDK. See [`LICENSE`](./LICENSE). Circuits and contracts published under Phase 2 may carry separate licenses, declared at the time of release.
