# ADR 0006: License is Apache 2.0

## Status
Accepted (2026-05-12).

## Context
OQ-1 in the Phase 1 spec listed License (Apache 2.0 vs MIT vs dual) as
deferred. Sprint 1 committed Apache 2.0 to LICENSE / README / package.json
as the working default. AUTON 2026-05-17 keynote slides reference the
license; ambiguity must be removed before keynote.

## Decision
Apache 2.0 for the SDK, contracts, circuits, and reference integrations.
No dual-license. Sub-packages (e.g., crewai-plugin) inherit Apache 2.0.

## Rationale
- Patent grant clause covers contributors against patent claims from
  external parties touching the protocol primitive (PoP x hostage).
- Compatible with OpenZeppelin Contracts v5 (MIT) and viem (MIT) used in
  the SDK and contracts.
- Widely accepted in Solidity and zk-research ecosystems.
- More permissive than copyleft licenses; commercial adopters can build
  closed-source products on top.

## Consequences
- Contributors must accept the Apache 2.0 CLA implicit through commit
  signatures. No separate CLA tool until Phase 2.
- NOTICE file may be added in Sprint 2 once attribution requirements
  surface (OpenZeppelin v5 attribution).
- ZK circuit license is also Apache 2.0 (Sprint 4 confirms in circuit
  package).
