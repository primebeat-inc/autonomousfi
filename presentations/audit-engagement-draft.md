# AutonomousFi Solidity Audit Engagement Draft

> Draft for CEO review. **Do not send without sign-off.** Send from `tatsunari.shibuya@prime-beat.com`.

## Recipients

Three firms in parallel:
- Trail of Bits: `audit@trailofbits.com` and intake form at https://www.trailofbits.com/contact
- Spearbit: intake at https://spearbit.com
- OpenZeppelin: `security@openzeppelin.com`

## Subject

`Audit engagement enquiry: AutonomousFi (Solidity, immutable V1, ~700 SLoC)`

## Body

Hi audit team,

I am Tatsunari Shibuya, CEO of Prime Beat Inc., reaching out to scope a Solidity audit for the AutonomousFi protocol.

**What we are building.** AutonomousFi is a self-custodial USDT settlement + zk reputation primitive for AI agent service marketplaces. The Solidity layer is three immutable V1 contracts that orchestrate ERC20 escrow + provider stake + dispute resolution. Public repository: https://github.com/primebeat-inc/autonomousfi

**Audit scope (Sprint 2 closure).**
- `EscrowVault.sol`: ERC20-locked escrow with timeout, RBAC, ReentrancyGuard, SafeERC20.
- `HostageBond.sol`: ERC20-locked provider stake with slash + refund, RBAC.
- `ServiceMarketplace.sol`: state-machine orchestrator with atomic createTask, settle, dispute, admin-resolved dispute path.
- Total: approximately 700 SLoC of Solidity (excluding tests and interfaces). Solidity 0.8.27, OpenZeppelin Contracts v5.0.2. No proxies, no upgrade paths.

**Test coverage delivered with the engagement.**
- 60+ unit tests (Foundry, 100% line, 90%+ branch on every contract)
- 4 fuzz tests at 1000-default runs each, lifted to 1M for the audit handoff
- 3 invariant tests at 256 runs depth 32 (funds conservation, no double resolve, status monotonicity)
- Slither clean per `slither.config.json`
- Mythril clean per-contract (300s budget)
- Gas snapshot baseline included
- Threat model (`packages/contracts/THREAT_MODEL.md`): trust assumptions, attacker model, known limitations

**Budget and timeline.**
- Target budget: USD 30K to 50K (single-firm Solidity audit; the ZK circuit layer engages Veridise or zkSecurity separately in Sprint 4)
- Lead time ask: 6 to 10 weeks
- Engagement letter to be signed during Sprint 3 (2026-06-09 onward)
- Mainnet deploy gated on audit completion (Sprint 6+)

**Funding source.** Parallel pursuit of (a) ongoing Tether co-development partnership conversations (USDT is the settlement asset, Plasma deploys) and (b) Ethereum Foundation Privacy and Scaling Explorations grant proposal. Funding confirmed by mid-Sprint 3.

**Pre-read materials.**
- Repository (public): https://github.com/primebeat-inc/autonomousfi
- Design spec: `docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md`
- Sprint 2 design: `docs/superpowers/specs/2026-05-12-sprint-2-design.md`
- Threat model: `packages/contracts/THREAT_MODEL.md`
- ADRs 0004 and 0005

Happy to schedule a 30-minute scoping call. Available Tokyo evenings (JST), Tuesdays through Fridays.

Thanks for considering,

Tatsunari Shibuya
CEO, Prime Beat Inc.
shibutatsu.eth | @shibutatsu | https://prime-beat.com

## CEO checklist before send

- [ ] Confirm USD 30K-50K budget against current cash position
- [ ] Decide simultaneous vs sequential outreach to all three firms
- [ ] Replace `https://prime-beat.com` link if domain changed
- [ ] Verify `shibutatsu.eth` and `@shibutatsu` handles still active
- [ ] Attach THREAT_MODEL.md PDF export or link commit-pinned source
