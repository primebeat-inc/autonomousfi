# Threat Model: AutonomousFi Contracts (Sprint 2)

## Scope

EscrowVault, HostageBond, ServiceMarketplace on Plasma testnet. USDT (or bridge equivalent on Plasma) is the only ERC20 the system handles. Sprint 2 ships immutable V1 contracts. No proxy. Migration on V2 via redeploy.

## Trust assumptions

| Actor | Trust level | What they can do |
|---|---|---|
| Deployer | Initial DEFAULT_ADMIN_ROLE on all three contracts | Grant or revoke roles; transfers DEFAULT_ADMIN_ROLE to a Safe multisig immediately after deploy |
| ServiceMarketplace | OPERATOR_ROLE on EscrowVault and HostageBond | Call lock / release / refund / stake / slash. Cannot bypass its own state machine. |
| ADMIN_ROLE on ServiceMarketplace | Safe multisig per ADR-0005 | Resolve disputes manually in Sprint 2. Phase 4 replaces with DAO arbitration. |
| Requester | Untrusted external account | Submit createTask / settle / dispute. Must pre-approve EscrowVault. |
| Provider | Untrusted external account | Submit results. Must pre-approve HostageBond. |
| ERC20 (USDT) | Trusted upstream | SafeERC20 protects against missing return values. |

## Attacker model

### Malicious provider
- Submits garbage result hash: requester disputes, ADMIN_ROLE slashes the hostage. Provider loses stake.
- Refuses to submit: requester waits until deadline, then permissionless escrow.refund returns funds. Hostage is not auto-slashed in Sprint 2; Phase 5 adds automated deadline path.

### Malicious requester
- Refuses to settle on good result: hostage and escrow stay locked. Provider has no automatic recourse in Sprint 2; admin or governance must intervene. Phase 4 adds a provider-side dispute path.
- Creates task then frontruns submit with dispute: dispute is only valid after submit (WrongTaskStatus guard).
- Self-dealing: SelfDealing revert in createTask blocks `requester == provider`.

### Malicious admin (compromised key)
- Can resolve any disputed task in either direction. Cannot drain non-disputed funds (no withdrawal function). Blast radius bounded.
- Mitigation: ADMIN_ROLE held by Safe multisig per ADR-0005, N-of-M signatures.
- Cannot upgrade or migrate contracts (immutable V1).

### MEV bot
- Frontrun createTask: harmless. Task hash is unique per call (TaskAlreadyExists revert).
- Sandwich settle: only protocol-internal transfers. No AMM to extract from.

### Reentrancy attacker (malicious token)
- Mitigation: ReentrancyGuard on every state-changing function. CEI pattern: state writes before external calls.

### Gas griefing
- Long deadline + dust-amount tasks: storage cost paid by requester. No DoS.
- View functions O(1). No invariant scales poorly.

## Known limitations (Sprint 2)

1. No dispute resolution for refusing-to-settle requester (Phase 4)
2. ADMIN_ROLE held by a single multisig signer set; threshold collusion drains disputed funds
3. No upgrade path. Bug forces V2 redeploy + state migration (Phase 3)
4. No formal verification (Certora as audit firm follow-up; ZK circuit audit is Sprint 4 separate)
5. Permit flow (ERC-2612) noted in ADR-0005 not yet implemented; only `approve + transferFrom`
6. Plasma testnet behavior may differ from mainnet; deploy is Sprint 6 at earliest

## Audit deliverables (Sprint 2 closure)

- Frozen contract source at commit SHA
- This document
- Foundry test suite: 60+ unit, 4 fuzz, 3 invariants
- Gas snapshot baseline
- Slither config + clean report
- Mythril per-contract report
- ADRs 0004 + 0005

## Brand rule

No em dashes, no Web3/Web2. Terms used: crypto, on-chain, ERC20, role-based access control.
