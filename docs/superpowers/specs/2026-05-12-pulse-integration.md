# Pulse PoC Integration Relationship

**Date**: 2026-05-12
**Status**: Default Scenario 3 (separate), Scenario 1 as planned convergence path
**Owner**: Shibuya (Prime Beat CEO)

## Why this doc exists

Prime Beat is running two sibling PoCs that both touch "AI agent stablecoin payment":

1. **AutonomousFi Agent** (this repo): agent-to-agent service marketplace primitive with reputation.
2. **Pulse**: machine-to-machine (M2M) stablecoin payment rails PoC.

Engineers and outside reviewers will look at both repos and ask "are these the same product? are they competing? which one wins?" This doc is the canonical short answer. The two are complementary, not competing. They live at different layers of the stack and target different customer segments.

## Layer assignment

| Aspect | Pulse | AutonomousFi |
|--------|-------|--------------|
| Layer | Payment rails (closer to chain and device) | Service marketplace primitive (closer to AI agent framework) |
| Primary customer | IoT/M2M device operators, payment integrators | AI agent developers, autonomous service providers |
| Core concern | Settlement, AA wallets, x402, Teahorse integration | paid_agent decorator, hostage stake, zk reputation |
| Stage / phase | Stage A through D over 24 months | Phase 1 through 4 over 18 months |
| Kickoff | 2026-05-05 | 2026-05-11 |
| Location | `~/Documents/projects/project-pulse/` (private) | This repo |

**Pulse** is the rail. **AutonomousFi** is the marketplace that can ride the rail.

## Integration scenarios

### Scenario 1: AutonomousFi rides on Pulse rails

If Pulse delivers a production-grade M2M payment SDK with stable adapters, AutonomousFi swaps its viem-direct payment path for Pulse's adapter layer. Pulse handles chain abstraction, AA wallets, retry logic, and gas sponsorship. AutonomousFi focuses entirely on the marketplace primitive (decorator, stake, reputation) and treats Pulse as a payment dependency.

This is the planned convergence path if both products survive 2027.

### Scenario 2: Pulse uses AutonomousFi reputation

If Pulse needs sybil-resistant operator reputation (for example, ranking M2M payment relays or rating device operators), the PoP + hostage stake primitive from AutonomousFi can be embedded as a reputation module inside Pulse. AutonomousFi exposes a reputation SDK; Pulse consumes it as a library.

This is the inverse direction and less likely than Scenario 1, but kept open as a possibility.

### Scenario 3: Fully separate

Different customers, different revenue lines, different go-to-market motions. Integrations only happen at the spec level (shared vocabulary, shared design notes), not at the code level. Each PoC ships independently and is evaluated on its own merits.

**This is the current default.** Convergence costs (shared APIs, joint releases, coordinated migrations) are real, and trying to integrate two PoCs prematurely usually kills both.

## Resource overlap risk

Prime Beat is a 5-person company. Running two PoCs at the same time creates real capacity risk.

- **CEO** is involved in both at the strategy level (proposal direction, customer conversations, R&D framing). This is the largest single point of overlap.
- **Claude Code** does the bulk of implementation in both repos. Token budget and context switching matter.
- **Lead Engineer 牧野** is committed to Pulse but **not** to AutonomousFi. furehako Phase 1 (¥10M, Sprint 1-1 through 1-7) plus two sibling PoCs would exceed capacity.
- **Lead Researcher 佐藤** (akafuda) is on the Whuffie R&D track, which connects to AutonomousFi's reputation primitive at the theory layer. He is not implementing either PoC.

### Mitigation

Each sprint must declare in advance which of Pulse vs AutonomousFi gets the CEO's 6-day-per-month strategy budget for that month. Default split:

- Odd months: Pulse gets 4 days, AutonomousFi gets 2 days
- Even months: AutonomousFi gets 4 days, Pulse gets 2 days

This is reviewed monthly. If furehako delivery is at risk in any given month, both PoCs drop to a maintenance cadence.

## Decision gates

### 2026-08 (Sprint 2 of AutonomousFi, Stage A of Pulse converging)

Re-evaluate Scenario 1 vs Scenario 3 based on:

- Pulse Stage A deliverables (does the M2M payment SDK have a stable adapter surface?)
- AutonomousFi Sprint 2 deliverables (is the paid_agent decorator and hostage stake working end-to-end?)
- Customer signal (do early pilots want both products together or separately?)

Outcome of this gate: explicit decision to either start adapter work (Scenario 1) or stay separate (Scenario 3).

### 2027 Q1 (mainnet target for both)

Joint go-no-go meeting. Possible outcomes:

- Convergence is clean: absorb one into the other (likely Pulse becomes the rail, AutonomousFi sits on top).
- Convergence is messy: commit to fully separate for the production launch.
- One PoC is clearly outperforming the other: sunset the weaker one and refocus the team.

This gate is non-negotiable. We do not ship two overlapping products to production without a settled relationship between them.

## Cross-references

- This repo design spec: `docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md`
- Pulse spec: not in this repo; lives in `~/Documents/projects/project-pulse/` (private)
- Memory pointers:
  - `~/.claude/projects/-Users-shibuyaryuukyou/memory/project_pulse.md`
  - `~/.claude/projects/-Users-shibuyaryuukyou/memory/project_autonomousfi_agent.md`

## Brand rule

No em dashes. No "Web3" or "Web2" (use "blockchain", "onchain", "DeFi", "DePIN", "Agentic Finance" or specific domain names instead).
