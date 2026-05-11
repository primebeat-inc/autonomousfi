# Changelog

All notable changes to AutonomousFi Agent are documented here. Format follows Keep a Changelog. SemVer applies to the `@autonomousfi/sdk` package.

## [Unreleased]

Planned for Phase 2 (2026-08+): Solidity contracts (EscrowVault, HostageBond, ServiceMarketplace), Risc0 reputation circuit, zkPassport integration, Plasma testnet deploy, dual external audit. See `docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md` for the full roadmap.

## [0.1.0] - 2026-05-12

### Added

- TypeScript SDK with `paidAgent` factory, in-memory `MockChain`, `QVACQualityVerifier` stub, escrow + hostage flow
- Brand-safe constructors `asAgentAddress`, `asTaskId`, `asPrice` for the three branded types
- `STUB_FAILURE_SCORE` exported constant for downstream test parity
- `MAX_U64` exported boundary constant
- 60 SDK unit tests across 6 files: types, errors, mock-chain, quality, paid-agent (unit), e2e. Coverage 100/92/100/100 (lines/branches/functions/statements).
- CrewAI plugin alpha (`crewai-paidagent`) with subprocess bridge to TS SDK, 30s timeout guard, JSON decode safety
- AUTON 2026-05-17 keynote deck (12 slides), speaker notes, demo recording placeholder, 5/17 morning rehearsal script
- GitHub Actions CI with `permissions: contents: read`, `concurrency.cancel-in-progress`, and brand-rule grep gate (blocks em dashes and Web3/Web2 buzzwords in markdown)
- Apache 2.0 LICENSE, CONTRIBUTING, ROADMAP, README, QUICKSTART

### Quality bar

- All public-facing markdown free of em dashes (brand rule)
- No "Web3" / "Web2" buzzwords in body content
- Score fixed-point encoding (`u32` 1e6 scale) binding decision documented in spec §7.1
- Coverage threshold gate: 95% lines / 85% branches / 95% functions / 95% statements (excluding `src/index.ts` barrel)

### Known limitations

- Mock-only chain: real Plasma settlement lands in Sprint 3
- Stub LLM judge: real QVAC local inference lands in Sprint 5
- CrewAI plugin uses subprocess bridge (3-5s `tsx` cold start): Sprint 2 replaces with long-lived HTTP service
- `Object.values(input)` positional spread in `paidAgent.call`: type-invisible coupling, planned change in Sprint 2
- `packages/contracts/` and `packages/circuits/` are scaffolded empty: Sprint 2-4 fills them
- AUTON keynote demo runs against in-memory mock, not real testnet

### Breaking changes from 0.0.1

None. 0.0.1 was never published; this is the first numbered release.

[Unreleased]: https://github.com/primebeat-inc/autonomousfi/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/primebeat-inc/autonomousfi/releases/tag/v0.1.0
