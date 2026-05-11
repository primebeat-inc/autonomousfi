# Security Policy

## Supported versions

Phase 1 SDK is alpha. Security fixes target the current `main` only. Tagged releases (v0.1.0+) are research artifacts, not production deployments. Mainnet target is 2027 Q1; no real funds are at risk until then.

## Reporting a vulnerability

- Email: tatsunari.shibuya at prime-beat.com
- PGP key: TBD (will be added before Phase 2 audit window)
- Response SLA: 7 days for acknowledgment, 30 days for assessment

Do NOT open public issues for vulnerabilities. Use email above.

## Scope

In scope:

- `packages/sdk` TypeScript SDK
- `packages/crewai-plugin` subprocess bridge
- `packages/sdk/scripts/ipc.ts` IPC payload handling
- CI workflow (`.github/workflows/`)

Out of scope for Phase 1:

- `packages/contracts/` and `packages/circuits/` are empty scaffolds. Phase 2 audit window is the right time for those reports.
- Dependencies (npm / pypi). Report upstream.

## Audit history

- Phase 1 (Sprint 1): no external audit. Internal review only.
- Phase 2 (planned 2026-10): Solidity contracts to be audited by one of Trail of Bits / Spearbit / OpenZeppelin. ZK circuits by Veridise / zkSecurity.
- Bug bounty: planned for Phase 3 (2027 Q1) at $10K initial funding via Immunefi or equivalent.

## What we will and will not promise

We will:

- Acknowledge receipt within 7 days
- Keep researcher identity confidential unless asked otherwise
- Credit researcher in CHANGELOG (with permission) for accepted reports
- Reciprocate with reasonable Q&A about the fix timeline

We will not (Phase 1):

- Pay bounties (Phase 3+)
- Sign legal safe-harbor agreements (legal capacity not yet established for that)

## Brand rule

This file follows the project brand rule: no em dashes, no Web3/Web2.
