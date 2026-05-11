# Roadmap

See `docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md` §12 for the authoritative roadmap.

## Sprint 1 (2026-05-12 to 2026-05-24)
- Monorepo bootstrap
- SDK in-memory mock + `@paid_agent` decorator
- CrewAI plugin alpha
- AUTON 5/17 keynote

## Sprint 2 (2026-05-26 to 2026-06-07)
- Solidity contracts: `Treasury.sol`, `AgentRegistry.sol`, `PaymentRouter.sol`
- Foundry test suite + invariant tests
- Deployment scripts and local anvil harness
- Design doc: `docs/superpowers/specs/2026-05-12-sprint-2-design.md`

## Sprint 3 (2026-06-09 to 2026-06-21)
- viem swap integration (USDC/JPYSC routing)
- Plasma testnet deployment
- CrewAI HTTP transport for remote agent calls
- Design doc: `docs/superpowers/specs/2026-05-12-sprint-3-design.md`

## Sprint 4 (2026-06-23 to 2026-07-05)
- Risc0 zkVM circuits for off-chain proof attestation
- Verifier contract on testnet
- Benchmark report (proof time, gas cost)
- Design doc: `docs/superpowers/specs/2026-05-12-sprint-4-design.md`

## Sprint 5 (2026-07-07 to 2026-07-19)
- zkPassport integration for agent operator KYC
- Selective disclosure flow
- E2E demo: gated payment with passport proof
- Design doc: `docs/superpowers/specs/2026-05-12-sprint-5-design.md`

## Sprint 6 (2026-07-21 to 2026-07-31)
- Phase 1 closure: integration tests, audit prep, docs freeze
- Grant submissions (Ethereum Foundation, Plasma, Risc0)
- Public demo + announcement
- Design doc: `docs/superpowers/specs/2026-05-12-sprint-6-design.md`

## Cross-cutting workstreams
- Pulse integration plan: `docs/superpowers/specs/2026-05-12-pulse-integration.md`
- Grant pursuit timeline: `docs/superpowers/specs/2026-05-12-grant-pursuit-timeline.md`

## Subsequent sprints
See spec §12 + `docs/superpowers/plans/` for sprint plans.
