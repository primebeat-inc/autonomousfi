# ADR 0005: Sprint 2 open question defaults (Q1-Q4)

## Status

Accepted (2026-05-12). Sprint 2 implementation follows these defaults unless a new ADR supersedes one.

## Context

Sprint 2 design doc (`docs/superpowers/specs/2026-05-12-sprint-2-design.md`, "Open Questions for Sprint 2 Kickoff" section) lists four questions that "must be resolved on the Day 1 kickoff call". The Sprint 2 plan cannot be executed without these defaults frozen.

## Decisions

### Q1: Plasma testnet RPC provider

**Default**: Tether official Plasma testnet RPC, with a configurable fallback URL in the SDK config.

Rationale: first-party endpoint avoids adding an extra trust dependency. Fallback URL exists in config so a third-party (Infura, Alchemy if available) can be enabled with one env var if the Tether endpoint has stability issues.

### Q2: ServiceMarketplace upgradeability

**Default**: Immutable V1. No proxy. Migration on V2 via redeploy.

Rationale:
- Upgradeable proxies add audit cost ~30% per the spec
- Audit firms consistently flag proxy admin keys as the largest centralized control point
- Sprint 2 ships a research-grade alpha, not a long-lived mainnet contract; V2 migration is acceptable
- Phase 3 explicitly plans the migration tooling

### Q3: ERC20 approval flow

**Default**: Support both. `approve + lock` is the always-available path; ERC-2612 `permit` is a fast path that we use when the token supports it.

Rationale: USDT on Plasma may or may not implement ERC-2612. Supporting both keeps us forward-compatible. Implementation: `lock()` accepts optional permit signature; if non-empty, call `permit()` before `transferFrom`. If empty, rely on prior `approve()`.

### Q4: Operator role

**Default**: `ServiceMarketplace` alone holds `OPERATOR_ROLE` on `EscrowVault` and `HostageBond`. A Safe multisig holds `DEFAULT_ADMIN_ROLE` for role management only (granting / revoking `OPERATOR_ROLE`), never for direct operator actions.

Rationale:
- Single operator simplifies the audit surface
- Multisig holding only role-management is a clean recovery path without becoming a backdoor
- Auditors will accept this pattern (standard OpenZeppelin AccessControl)

## Consequences

- Sprint 2 implementation proceeds with these as starting points
- Any deviation requires a new ADR documenting the change and its rationale
- Sprint 3 may revisit Q1 (RPC) and Q3 (permit) based on actual Plasma testnet behavior
- Sprint 4 audit prep documents these decisions in `THREAT_MODEL.md`

## Follow-up

- Sprint 2 plan Task 0 references this ADR
- Sprint 2 design doc updated in a chore commit to mark Q1-Q4 as "resolved (see ADR-0005)"
