# Architecture Overview

このページは AutonomousFi の単一ページ俯瞰図。詳細な仕様 (motivation, invariants, threat model, sprint plan 等) は full spec を参照。

## 1. System at a glance

4 層構成。上から下に依存が流れる。各層は独立に audit / test 可能。

```
┌─────────────────────────────────────────────────────────────────────┐
│  Reference Integrations  (CrewAI plugin, Claude Agent SDK adapter)  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ TypeScript public API
┌──────────────────────────▼──────────────────────────────────────────┐
│  SDK Layer  (TypeScript / Bun runtime)                              │
│   @paid_agent decorator, USDTEscrow, HostageStake,                  │
│   ReputationVerifier, ZkPoPProvider, QVACQualityVerifier            │
└─────────┬────────────────────────┬──────────────────────────────────┘
          │                        │
          │ viem RPC               │ Risc0 host SDK
          ▼                        ▼
┌─────────────────────────┐  ┌─────────────────────────────────────┐
│ Protocol Layer (Solidity│  │ ZK Layer (Risc0 zkVM, Rust)         │
│ on Plasma)              │  │  reputation_aggregator              │
│  EscrowVault            │  │  pop_attestation                    │
│  HostageBond            │  │  (proofs published to chain)        │
│  ReputationRegistry     │◄─┤                                     │
│  PoPVerifier            │  │                                     │
│  ServiceMarketplace     │  │                                     │
└─────────────────────────┘  └─────────────────────────────────────┘
          │                        │
          │ events / state          │ zkPassport SDK / Worldcoin SDK
          ▼                        ▼
┌─────────────────────────┐  ┌─────────────────────────────────────┐
│ Reputation Layer (off-  │  │ External Identity Providers          │
│ chain aggregator, QVAC  │  │  zkPassport, Worldcoin (PoP source)  │
│ local LLM judge)        │  │                                     │
└─────────────────────────┘  └─────────────────────────────────────┘
```

## 2. Where to start reading

役割別の入口ファイル。深掘りは spec を参照。

### SDK consumer (agent 開発者として SDK を使う人)
- `packages/sdk/README.md` — quick example + API surface
- `packages/sdk/src/paid-agent.ts` — `@paid_agent` decorator 実装
- `packages/sdk/src/types.ts` — 公開型定義 (TaskSpec, EscrowStatus 等)
- `packages/crewai-plugin/` — reference integration (CrewAI 経由の利用例)

### Contract author (Protocol Layer を触る人)
- `packages/contracts/src/interfaces/IServiceMarketplace.sol` — orchestrator entrypoint
- `packages/contracts/src/interfaces/IEscrowVault.sol` — USDT lock/release/refund
- `packages/contracts/src/interfaces/IHostageBond.sol` — provider stake/slash
- Spec §5.2 (Smart contract components), §6 (Data Flow), §8 (Invariants)

### Circuit author (ZK Layer を触る人)
- `packages/circuits/methods/guest/reputation_aggregator/` — Risc0 guest program
- `packages/circuits/methods/guest/pop_attestation/` — PoP attestation circuit
- `packages/circuits/Cargo.toml` — toolchain pin
- Spec §5.3 (ZK circuits), §7 (公開/非公開入力境界)

### Researcher (経済設計 / Whuffie 接続 / threat model を読む人)
- `docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md` — full spec (§3 motivation, §9 threat model, §10 economics)
- `docs/adr/` — architectural decision records
- `docs/retrospectives/` — sprint retros
- `docs/ROADMAP.md` — sprint 1 から 6 までの window と納品ポインタ

## 3. Tech stack one-liner

TypeScript / Bun SDK + Solidity 0.8.x on Plasma + Risc0 zkVM 1.0+ Rust circuits + QVAC local LLM judge + zkPassport / Worldcoin PoP.

## 4. Full spec

詳細は `docs/superpowers/specs/2026-05-11-autonomous-fi-agent-design.md` を参照。
