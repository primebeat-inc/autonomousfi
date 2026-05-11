# Sprint 2 Plan (skeleton)

> Skeleton only. Full plan will be expanded via the `writing-plans` skill in the next development session before execution.

## Sprint 2 Plan (skeleton, expand via writing-plans skill before execution)

### Reference
- Design: `docs/superpowers/specs/2026-05-12-sprint-2-design.md`
- Phase 1 spec: `docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md` (Section 5.2 contracts, Section 7 ZK design)
- MockChain semantic source: `packages/sdk/src/mock-chain.ts`

### Tasks (to be expanded)

1. **Foundry environment**: `forge install` openzeppelin-contracts, forge-std; verify `foundry.toml` settings against spec gates
2. **EscrowVault.sol**: TDD, target 100% line + 95% branch coverage, 1M+ fuzz runs on lock/release/refund
3. **HostageBond.sol**: same TDD pattern, slash + refund branches
4. **ServiceMarketplace.sol orchestrator**: lock+stake atomicity, settle/dispute fork
5. **Custom errors**: one Solidity custom error per `errors.ts` constant; assertion table linking the two
6. **Invariant tests**: funds-conservation across full settle and slash cycles (port MockChain I1 invariant)
7. **Plasma testnet deploy**: Foundry script, ENV-driven RPC, broadcast script
8. **SDK adapter**: replace MockChain consumers in `packages/sdk/src/paid-agent.ts` with a viem-backed adapter; both impls live behind a common interface so the existing 64+ tests still run via MockChain
9. **CI workflow**: add `contracts` job (forge build + forge test + slither + mythril); add `circuits` job stub
10. **Acceptance gate**: all SDK tests still pass against MockChain; all contract tests pass; static analysis clean

### Acceptance criteria
- 100% Solidity line coverage, 95% branch
- 1M+ fuzz / 256 invariant runs
- Slither + Mythril clean (no high or medium findings)
- Plasma testnet deploy verified
- SDK e2e against testnet completes in under 30s
- Audit proposal sent to one of Trail of Bits / Spearbit / OpenZeppelin by end of sprint

### Resource budget
- CEO ~6 days available May 26 to June 7
- Claude Code 24/7
- 牧野 still unavailable (furehako Phase 1 dragging)
- External audit prep coordination only, audit execution starts in Sprint 4

### Out of scope
- Risc0 circuit work (Sprint 4)
- Mainnet deploy
- HTTP service replacing CrewAI subprocess bridge (Sprint 3)

This skeleton intentionally leaves task-level step-by-step TDD instructions empty. Expand via `writing-plans` skill in the next development session.
