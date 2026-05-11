# AUTON 2026-05-17 Announce Drafts

CEO sends both manually. Discord DM is plain text for immediate internal status. X thread is for public release timed to 5/17 morning or right after the AUTON keynote (CEO judgment).

## Discord DM draft (channel `1485538350155694161`)

```
🚀 AutonomousFi Sprint 1+2+3 wave 1 完了
📦 https://github.com/primebeat-inc/autonomousfi
📋 90+ commits, 71 SDK tests + 53 Foundry tests, 100/90+% coverage
🎯 AUTON 5/17 keynote 用 deck + speaker notes + 当日リハーサル script 用意済
🏷 v0.1.0 SDK tagged, public Apache 2.0

Sprint 1 deliverables: paidAgent SDK + MockChain + CrewAI plugin alpha
Sprint 2 deliverables: EscrowVault + HostageBond + ServiceMarketplace + I1-3 invariants
Sprint 3 Wave 1: ChainAdapter interface + 3 viem clients + ViemChainAdapter + Plasma config + CrewAI HTTP service

5/17 当日朝のリハ: rehearsal.md L1-L78 をそのまま実行
Audit firm 送信: presentations/audit-engagement-draft.md 確認後送信
EF PSE proposal: presentations/grant-ef-pse-draft.md 確認後送信

次セッションでやれる: Sprint 3 Wave 2 (Plasma testnet 実 deploy + paidAgent refactor、env 必要)
今は AUTON keynote 成功 + furehako Phase 1 デリバリーが priority
```

## X (Twitter) thread draft

```
1/ 🚀 Open-sourcing AutonomousFi Agent today.

SDK + protocol that lets AI agents pay other AI agents in stablecoins and trust the counterparty, without a central marketplace. A working implementation of the constructive PoP x hostage hybrid mechanism, the Whuffie construction.

github.com/primebeat-inc/autonomousfi

2/ Core thesis: cheap identity makes pure reputation economies impossible (Theorem 1). Adding Proof-of-Personhood + slashable hostage stake makes honest the dominant strategy (Theorem 2).

Sprint 1+2 closed: TS SDK (71 tests), Solidity contracts (53 Foundry tests, 100/90%+ coverage, I1-I3 invariants).

3/ Vertical stack on Tether infrastructure:
- QVAC (on-device LLM judge)
- WDK (self-custodial wallet)
- Plasma (settlement)
- Risc0 zkVM (privacy-preserving reputation, Sprint 4)
- zkPassport (PoP, Sprint 5)

Audit prep underway. Plasma mainnet target 2027 Q1.

4/ Open call:
- Agent devs: @paid_agent decorator works today on mock chain
- Researchers: full Theorem 1/2 proofs + 11-task Sprint 2 implementation plan in repo
- Builders: AUTON 2026-05-17 Tokyo keynote walks through it; slides in /presentations

🧵 cc @shibutatsu
```
