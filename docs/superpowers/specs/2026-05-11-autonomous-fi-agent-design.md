---
title: "AutonomousFi Agent: Design Spec"
status: draft (under review)
authors: Tatsunari Shibuya (Prime Beat Inc.)
date: 2026-05-11
related:
  - Whuffie research (Prime Beat R&D 北極星)
  - AUTON Program (Agentic Finance Incubation, 5/17 kickoff)
  - Tether Developer Grants Program
---

# AutonomousFi Agent: Design Spec

## 1. Overview

AutonomousFi Agent は、AI エージェントが別の AI エージェントへ USDT で対価を支払いつつ、過去履歴を漏らさずに信用を証明できる SDK + プロトコル。Tether の QVAC (オンデバイス AI) + WDK (self-custodial wallet) スタック上に構築し、Plasma チェーンで決済する。Risc0 zkVM 上に reputation aggregation 回路と PoP attestation 回路を実装し、Whuffie 論文 Theorem 2 が提示した "PoP × hostage" の構成的メカニズムを稼働コードとして提供する。

中核ユースケースは「Agent Service Marketplace with Hostage Reputation」: ある agent が別の agent にタスク (例: code review, research, document drafting) を依頼し、被依頼側は hostage stake を担保にして納品、QVAC ローカル LLM judge が品質判定し、合格なら USDT 決済 + reputation 加算、不合格なら hostage が依頼側に slash される。

## 2. Goals & Non-goals

### 2.1 Goals (本リリースで満たす)

1. **agent-to-agent USDT 決済** が SDK 数行で実装できる (TypeScript primary)
2. **hostage stake + slashing** によって honest 行動を dominant strategy にする
3. **zk reputation aggregation** によって履歴を公開せずに「N 件以上 × 品質閾値以上」を on-chain で証明する
4. **zk-PoP integration** (zkPassport primary, Worldcoin secondary) によって cheap identity sybil を構造的に排除する
5. **CrewAI plugin** + **Claude Agent SDK adapter** を reference integration として提供する
6. **Plasma testnet → mainnet** を経て production-grade まで到達する
7. **外部 audit** (Solidity audit firm + ZK audit firm の dual audit) を経たうえで mainnet release する
8. **Whuffie 論文の empirical chapter** に必要な実測データ (50+ agent dogfooding, sybil simulation) を取得する

### 2.2 Non-goals (本リリースでやらない)

- Fiat onramp / offramp (USDT-native のみ)
- Custodial wallet 提供 (self-custody 強制)
- B2C エンドユーザー向け UI (B2D, SDK fokus)
- マルチチェーン deploy (Phase 1-3 では Plasma のみ。Base / Optimism は Phase 4 以降検討)
- zkML quality verification (proving time が 2026 年時点で agent task の実時間を超えるため、Phase 5 以降検討)
- DAO arbitration (Phase 2-3 は 3rd-party audit agent による majority rule、DAO 化は Phase 4 以降)
- Generic payment processor (Visa/MC 系の B2C 決済領域には踏み込まない。agent-to-agent P2P に絞る)

## 3. Stakeholders & Personas

### 3.1 Primary persona: AI Agent Developer (B2D)

- Auto-GPT, CrewAI, Devin, Anthropic Claude Agent SDK, LangGraph などのエージェント framework を利用するエンジニア / チーム
- agent が別の agent (社内別系統 / 外部 marketplace) に対して支払い・受領を行う場面の実装責任者
- AUTON Program 採択スタートアップもこの persona に含まれる (ドッグフーディング窓口)

### 3.2 Secondary personas

- **AI 研究者**: Whuffie 論文 / agent economy 研究者。実装データを参照
- **Tether ecosystem actor**: QVAC / WDK の flagship application として参照
- **VC / 投資家**: Phase 4 で SaaS pivot 判断時の dilemmas に関与

### 3.3 Stakeholder map (Prime Beat 内)

- **CEO / Founder**: 戦略決定、AUTON 登壇、外部交渉 (Tether co-dev、VC、audit firm)
- **Claude Code**: 実装の主軸 (社長と pair で進める)
- **Lead Engineer (牧野)**: 当面 furehako Phase 1 で投入不可。Phase 4 以降で再評価
- **Lead Researcher (佐藤)**: Whuffie 論文と並行、empirical 設計を共有

## 4. System Architecture

### 4.1 4-layer overview

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

### 4.2 Boundary rationale

- **SDK Layer**: agent 開発者の I/F。Bun + TypeScript で配布、Node 18+ 互換
- **Protocol Layer**: trustless settlement。Solidity 0.8.x、Foundry test、OpenZeppelin upgradeable proxy (Phase 2 audit 後に freeze)
- **ZK Layer**: privacy preserving proof。Risc0 zkVM 1.0+、Rust guest program、Groth16 wrapper for on-chain verification
- **Reputation Layer**: QVAC ローカル LLM judge (Llama 3.1 8B Instruct を baseline、project 進行に応じて smaller model 検証) + off-chain history (encrypted local store)

各 layer は独立 audit/test 可能で、ZK Layer と Protocol Layer は **異なる audit firm に発注** (single firm の blind spot 回避)。

## 5. Components

### 5.1 SDK components (TypeScript)

| 単位 | 役割 | 主要 API | 依存 |
|---|---|---|---|
| `@paid_agent` decorator | function を「価格 + stake 付き agent service」に変換 | `@paid_agent({ price, stake, qualityThreshold })` | SDK core |
| `USDTEscrow` client | escrow lock / release / refund を扱う | `lock()`, `release()`, `refund()`, `getStatus()` | viem, EscrowVault.sol |
| `HostageBond` client | stake / slash / withdraw | `stake()`, `slash()`, `withdraw()` | HostageBond.sol |
| `ReputationVerifier` client | 閾値 ZK proof を構築・on-chain verify | `proveThreshold()`, `verifyOnChain()`, `fetch()` | reputation_aggregator circuit, ReputationRegistry.sol |
| `ZkPoPProvider` | zkPassport / Worldcoin adapter | `attest()`, `getProof()` | zkPassport SDK, Worldcoin SDK |
| `QVACQualityVerifier` | local LLM judge で結果評価 | `evaluate(taskSpec, result) → score` | QVAC runtime |

### 5.2 Smart contract components (Solidity on Plasma)

| 契約 | 役割 | 主要関数 | テスト境界 |
|---|---|---|---|
| `EscrowVault.sol` | USDT lock with timeout + dispute window | `lock(provider, amount, deadline)`, `release(taskId)`, `refund(taskId)` | Foundry fuzz |
| `HostageBond.sol` | provider stake、slash 条件、refund | `stake(taskId, amount)`, `slash(taskId, recipient)`, `withdraw(taskId)` | Foundry invariant |
| `ReputationRegistry.sol` | reputation event log + threshold proof verifier | `recordCompletion(provider, score)`, `recordFailure(provider)`, `updateThreshold(provider, proof)` | property-based |
| `PoPVerifier.sol` | zk-PoP proof on-chain verifier | `verifyPoP(proof, humanCommitment)` | integration |
| `ServiceMarketplace.sol` | orchestrator (request/accept/complete/dispute フロー) | `createTask`, `acceptTask`, `submitResult`, `settle`, `dispute` | Foundry e2e |

### 5.3 ZK circuits (Risc0 zkVM, Rust)

| circuit | 公開入力 | 非公開入力 | 公開出力 |
|---|---|---|---|
| `reputation_aggregator` | `threshold_count`, `threshold_quality`, `pop_proof_root` | `history: Vec<TaskCompletion>` | `meets_threshold: bool`, `provider_pk`, `history_commitment: bytes32` |
| `pop_attestation` | `human_commitment`, `provider_pk` | zkPassport / Worldcoin attestation | `pop_valid: bool`, `provider_pk_bound: bool` |

### 5.4 Reference integrations

| integration | 言語 | 形態 |
|---|---|---|
| `crewai-paidagent` | Python | CrewAI plugin、TS SDK へ HTTP/gRPC で接続 |
| `claude-agent-sdk-paidagent` | TypeScript | Anthropic Claude Agent SDK の tool call wrapper |
| (Phase 3+) `langgraph-paidagent` | Python | LangGraph node 形式の adapter |

## 6. Data Flow

### 6.1 代表シナリオ: code review 委託

```
[Agent A: requester]                    [Agent B: provider]

  1. discover(provider_addr, task_spec)
     └ ReputationVerifier.fetch(provider_addr)
        └ on-chain: { reputation_threshold_proof, pop_proof }

  2. createEscrow(provider, task_spec_hash, price=0.1 USDT, deadline)
     └ EscrowVault.lock() emits TaskCreated
                                       │
                                       │ 3. acceptTask(task_id)
                                       │    └ HostageBond.stake(0.05 USDT)
                                       │    └ ServiceMarketplace.accept()
                                       │
                                       │ 4. (off-chain) execute task
                                       │    └ produce result + signed delivery
                                       │
                                       │ 5. submitResult(task_id, result_hash, sig)

  6. QVACQualityVerifier.evaluate(result, task_spec)
     └ local LLM judge → score ∈ [0,1]

  7a. score ≥ threshold: settle(task_id)
      └ EscrowVault.release → B receives 0.1 USDT
      └ HostageBond.refund → B receives stake back
      └ ReputationRegistry.recordCompletion(B, score=0.92)

  7b. score < threshold OR no submit by deadline: dispute(task_id)
      └ HostageBond.slash → A receives stake (0.05 USDT)
      └ EscrowVault.refund → A receives original 0.1 USDT
      └ ReputationRegistry.recordFailure(B)

  8. (async) ReputationVerifier.aggregate(local_history)
     └ Risc0 prove: "N≥10 completions ∧ avg quality ≥ 0.85"
     └ proof published → ReputationRegistry.updateThreshold(B)
```

### 6.2 不変条件 (invariants)

- **(I1) Funds conservation**: `sum(EscrowVault.balances) + sum(HostageBond.balances) = total USDT held by protocol`
- **(I2) Reputation monotonic upgrade**: `ReputationRegistry.threshold(B)` は recordCompletion でのみ上昇、recordFailure で下降。non-decreasing on the dimension of "ever-achieved threshold"
- **(I3) PoP uniqueness**: 同一 human commitment に bind された address は marketplace 内で 1 つのみ
- **(I4) No simultaneous double-stake**: `HostageBond.activeStakes(provider)` は同時に N 件以上 active にできない (N は config、初期値 = 10。**first iteration value、Phase 2 bench + Phase 3 empirical で実測 tuning**)

## 7. ZK Design (詳細)

### 7.1 reputation_aggregator (Risc0 guest program)

**Numeric encoding** (binding decision, do not vary between implementations):
quality score は guest program 内で `u32` の scaled fixed-point として扱う。範囲 `[0, 1_000_000]` (= 1e6 scale、6 桁精度)。`f64` は Risc0 zkVM で non-trivial かつ implementer 間で挙動が分岐するため明示的に禁止。SDK の TypeScript public API では `number` (0.0-1.0 range) を許容し、circuit 入力前に `Math.round(score * 1_000_000)` で変換する。

```rust
// guest program (executed inside Risc0 zkVM)
struct TaskCompletion {
    task_hash: [u8; 32],
    counterparty_sig: Signature,
    counterparty_pk: PublicKey,
    score_scaled: u32,   // fixed-point: actual_score * 1_000_000, range [0, 1_000_000]
}

fn aggregate_reputation(
    history: Vec<TaskCompletion>,    // private input (sealed)
    threshold_count: u32,             // public input
    threshold_quality_scaled: u32,    // public input (same 1e6 scale as score_scaled)
    pop_proof: ZkPoPProof,            // public input (zkPassport/Worldcoin)
) -> Result<ReputationStatement> {
    // verify each completion is signed by the counterparty
    for c in &history {
        verify_ecdsa(c.counterparty_sig, c.task_hash, c.counterparty_pk)?;
    }
    let count = history.len() as u32;
    // u64 accumulator to prevent overflow; result remains in 1e6 scale
    let sum_scaled: u64 = history.iter().map(|c| c.score_scaled as u64).sum();
    let avg_quality_scaled = (sum_scaled / count as u64) as u32;
    let pop_valid = verify_pop(pop_proof)?;

    Ok(ReputationStatement {
        meets_threshold: count >= threshold_count
                      && avg_quality_scaled >= threshold_quality_scaled,
        pop_unique_human: pop_valid,
        provider_pk: derive_from_pop(pop_proof),
        history_commitment: keccak256(&history),
    })
}
```

### 7.2 Proof lifecycle

- agent provider が local で `prove(history, thresholds, pop_proof)` 実行 → Groth16 wrapped proof (~256 bytes)
- `ReputationRegistry.sol` の verifier (Risc0 が提供する Groth16 verifier contract) が proof を検証 → boolean result を on-chain に書き込み
- 検証 cost: 約 250K gas (Plasma chain で数 cent)
- proving time bound (acceptance): history N=100 で 60 秒以内、N=1000 で 600 秒以内 (Phase 2 bench で実測)

### 7.3 zk-PoP integration

- **zkPassport (primary)**: passport-based, regulatory friendly。Phase 2 で integration、Phase 3 で empirical
- **Worldcoin (fallback)**: orb-based、地域・規制により利用不可な場合の代替
- どちらの証明書も `pop_attestation` circuit で統一形式 `(human_commitment, provider_pk_binding)` に変換し、ReputationRegistry が共通の verifier で検証する

### 7.4 Sybil resistance argument

cheap identity を作れない: PoP は 1 human につき 1 attestation。stake が PoP に bind されるので、低 reputation provider が再開チャンスを得るには新規 PoP 取得が必要だが、zkPassport (passport) は事実上 changeable でないため経済合理的に困難。これが Whuffie 論文 Theorem 2 の "PoP × hostage" 構成的解の実装根拠。

## 8. Error Handling

| エラー条件 | 検出位置 | 対応 |
|---|---|---|
| Task timeout (provider が deadline 内に submit せず) | `EscrowVault` の timeout check | A: escrow auto refund + B: hostage slash |
| Quality failure (QVAC judge score < threshold) | SDK `QVACQualityVerifier` | dispute path に分岐、A が `dispute()` 呼ぶ |
| PoP verification failure | `ReputationVerifier` (discovery 時) | provider candidate から除外 |
| Slashed stake が `HostageBond.minStake` を下回る | `HostageBond` invariant | provider 自動 inactive、再 stake 必要 |
| ZK proof verification failure | `ReputationRegistry` | proof reject、reputation 反映しない |
| Reputation aggregator が history hash 不一致 | `ReputationRegistry.updateThreshold` | proof reject、provider に再 prove 要求 |
| QVAC local judge disagree (provider と requester で異なる score) | dispute path | Phase 2: 3rd-party audit agent の majority rule (2/3)、Phase 4: DAO arbitration with stake-weighted voting |
| Network partition during settlement | viem retry layer | exponential backoff、3 回失敗で manual recovery alert |

### 8.1 Dispute resolution の Phase 設計

- **Phase 2 (research-grade)**: 3rd-party audit agent (高 reputation) が re-evaluation、majority rule (2/3 同意)
- **Phase 4 (production SaaS)**: 上記 + appealable DAO arbitration with stake-weighted voting

## 9. Security Considerations

### 9.1 鍵管理

- **Protocol upgradeability**: Safe multisig 3-of-5 for `ServiceMarketplace.upgrade()`。署名者は社長 + 牧野 + 林 + 馬 + 佐藤、または外部 trustee を含む構成 (Phase 2 開始時に決定)
- **SDK agent keys**: local hardware-bound (Secure Enclave on macOS/iOS、TPM on Windows/Linux) via WDK
- audit 前は upgradeable proxy、audit 後 immutable freeze

### 9.2 Replay protection

全 marketplace call に `nonce` + chainId binding、EIP-712 typed data signing

### 9.3 Front-running mitigation

- escrow creation の public memo に price を含まない (task_spec_hash のみ commit)
- result submission は commit-reveal (2-tx: hash commit → acceptance 後 reveal)
- 高価値 task (>10 USDT) はオプションで private mempool 経由

### 9.4 Sybil resistance

zk-PoP × hostage stake (Whuffie M_H)。新規 provider は (1) PoP 取得 + (2) minimum hostage deposit (例 5 USDT) を満たさないと marketplace 登録不可

### 9.5 Reputation manipulation 防止

- **Self-dealing**: requester と provider が同じ unique-human PoP の場合 reputation 加算なし (pop_attestation で human ID 比較)
- **Collusion**: アカウントペアの相互推薦は ReputationRegistry で graph 検出 (Phase 2: heuristic、Phase 4: cryptographic via private set intersection)
- **Bribery attack**: stake 額が reward の bribe potential 上限を超えるよう設計 (`minStake ≥ 0.5 × maxReward`。**first iteration ratio、Phase 2 game theory analysis + Phase 3 empirical で再校正**)

### 9.6 Audit checkpoints

- Phase 2 末: **Solidity contracts audit** (Trail of Bits / OpenZeppelin / Spearbit、$30-50K)
- Phase 2 末: **Risc0 circuit audit** (Veridise / zkSecurity、$40-60K)
- **異なる firm に発注** (single firm の blind spot 回避)

## 10. Testing Strategy

| Layer | Framework | Coverage 目標 | 何を測るか |
|---|---|---|---|
| SDK (TypeScript) | Vitest + fast-check (property) | 90%+ line, 80%+ branch | API 契約、エラー伝播、type safety |
| Smart Contracts (Solidity) | Foundry (forge test + invariant + fuzz) | 100% line, 95%+ branch, 1M+ fuzz runs/invariant | 状態遷移、re-entrancy、overflow、access control |
| ZK Circuits (Risc0/Rust) | proptest + Risc0 dev mode + criterion bench | 95%+ line, 100% public output paths | proof soundness、proving time bound |
| Reference integrations | Playwright (CrewAI testbed) + agent-browser | smoke + golden path | end-to-end demo flow |
| QVAC quality judge | snapshot test on canned task→result pairs | 50-100 fixture pairs | LLM judge stability (regression detection) |

### 10.1 特殊テスト

- **Formal verification**: `ReputationRegistry` の monotonicity invariant (I2) を Certora で証明。audit firm の付随サービスとして $10K 程度を見込む
- **Adversarial test**: Sybil simulation (100 fake providers vs 1 honest) + collusion simulation (10 colluders) を Phase 3 empirical の一部として実施。既存 `whuffie/harness/` (Prime Beat の autoresearch harness) を拡張して使う
- **Differential test**: QVAC local judge 結果と GPT-4o judge 結果を比較し、disagreement rate を測定。Phase 2 中に quality threshold を tuning

### 10.2 CI/CD

GitHub Actions → forge test + cargo test + vitest + Risc0 prove (mocked dev mode、30 秒以内)。mainnet deploy は manual approval + Safe multisig。

## 11. Grant Decomposition

並行 grant pursuit による audit 費 ($100K 規模) の調達を目指す。採択率 60% 仮定で $54-105K の見込み。不足分は Prime Beat キャッシュから ¥300-600 万拠出 (許容範囲)。

| # | Grant ソース | タスク / Proposal | 想定額 | 該当 Component | 応募 Phase |
|---|---|---|---|---|---|
| 1 | Tether wave (WDK Module) | `USDTEscrow` + `HostageBond` の Solidity 実装 + viem client | $3K | EscrowVault, HostageBond | Phase 1 末-2 初 |
| 2 | Tether wave (Template Wallet) | `paid_agent` reference wallet integration | $2K | SDK + CrewAI plugin | Phase 2 |
| 3 | Tether wave (Browser Ext) | reputation viewer browser extension | $4K | ReputationVerifier client UI | Phase 2 |
| 4 | Tether wave (Docs) | onboarding ドキュメント + 動画チュートリアル | $1.5K | SDK docs site | Phase 2 |
| 5 | Tether wave (QVAC SDK) | QVAC local LLM judge SDK | $3-5K | QVACQualityVerifier | Phase 2 |
| 6 | Tether co-dev (research) | full SDK + Whuffie implementation report | $10-30K (TBD via direct negotiation with Tether, see OQ-11) | 全体 research artifact | Phase 2-3 |
| 7 | EF Privacy & Scaling Explorations | "zk-PoP × hostage hybrid mechanism: a constructive resolution to the Whuffie problem" | $30-50K | ZK circuits + paper | Phase 1 末 |
| 8 | Optimism RetroPGF | retroactive: SDK + circuits を OP に deploy 後申請 | $20K+ | retroactive | Phase 3-4 |
| 9 | Base Builder Grants | Base deploy + USDC variant (optional) | $10K+ | secondary chain support | Phase 4 |
| 10 | Plasma ecosystem grant | (公募有るなら) chain-specific integration | $5-20K | Plasma-specific opt | Phase 2 |

### 11.1 応募業務の負荷分散

- Tether wave 個別タスク: Claude Code が proposal draft → 社長 30 分 review
- EF PSE / Optimism / Base: 社長 + Claude Code で技術 narrative 作成 (各 1-2 日)
- 月次 report: Claude Code 自動化 (deliverable diff + 進捗 summary を grant ごとに生成)

## 12. Roadmap

```
2026
├── 5月 ───────────────────────────────────────────────────────
│   Phase 1 開始
│   [5/12 spec freeze 候補] design spec 確定 + writing-plans へ移行
│   [5/15-5/16] GitHub repo `primebeat-inc/autonomousfi` public
│                README, vision, MEMORY 一新
│   [5/17] AUTON キックオフ登壇
│           "The Whuffie Problem in Practice"
│   [5/18-5/31] SDK 雛形 (TypeScript, in-memory mock)
│                @paid_agent decorator working
│                CrewAI plugin alpha
│
├── 6月 ───────────────────────────────────────────────────────
│   [6/1-6/15] Solidity contracts v0 (testnet only)
│                EscrowVault, HostageBond, ServiceMarketplace
│                Foundry test 80%+ coverage
│   [6/16-6/30] Plasma testnet deploy + SDK→contract integration
│                CrewAI demo: 30 秒で agent-to-agent USDT 決済
│
├── 7月 ───────────────────────────────────────────────────────
│   [7/1-7/15] Risc0 reputation circuit v0 (proof of concept)
│                proving time benchmark: <60s for 100 history
│   [7/16-7/31] zkPassport integration
│                ReputationVerifier client + on-chain verifier
│   [7/31] Phase 1 ゲート: spec + 動くデモ + AUTON 登壇済み + GitHub stars
│
├── 8-10月 ────────────────────────────────────────────────────
│   Phase 2 開始 (production-grade build)
│   [並行] Tether grant wave 個別応募 (#1-5)、EF PSE proposal 提出
│   [8月] contracts hardening, fuzz/invariant 100% coverage
│   [9月] ZK circuits final + property test + bench
│   [10月] Trail of Bits / Spearbit Solidity audit 開始 (発注)
│           Veridise / zkSecurity ZK audit 開始
│           ⚠ audit lead-time 6-10 週
│
├── 11-12月 ───────────────────────────────────────────────────
│   [11月] AUTON 6 チームで本格 dogfooding (Phase 3 開始)
│           Whuffie autoresearch harness 拡張で empirical 取得
│   [12月] audit 完了、findings 反映 → freeze
│           mainnet deploy 準備
│
2027
├── Q1 ────────────────────────────────────────────────────────
│   [1月] Plasma mainnet release v1.0
│           bug bounty 開始 ($10K, Immunefi or local program)
│   [2月] empirical 完了 (50+ agent, sybil simulation, real fee data)
│   [3月] Whuffie 論文 v3 完成、AAMAS 2027 / FC 2027 投稿
│           Tether co-dev report 提出 (関係深化)
│
├── Q2-Q3 ─────────────────────────────────────────────────────
│   Phase 4 開始 (SaaS pivot 判断)
│   - PMF signal (active agents, transaction volume, GitHub stars,
│     grant 連戦勝率) を集約
│   - go-no-go: SaaS shipping ↔ research artifact 化
│   - SaaS GO の場合: VC seed pitch 開始 ($500K-1M target)
│                      人材調達 (Lead Eng + DevRel)
│
└── Q4 ────────────────────────────────────────────────────────
    [10月] AAMAS 2027 / FC 2027 acceptance 通知 (target)
    [11-12月] Prime Beat ¥1 億売上目標達成期限 + Whuffie 論文 published
    → 2028/04 卒業後の自社プロダクト+seed Phase に Asset 全部 inherit
```

### 12.1 Phase ゲート criterion

- **Phase 1 → 2**: GitHub repo public + AUTON 登壇終了 + SDK 動くデモ + 30+ GitHub stars
- **Phase 2 → 3**: audit 完了 + mainnet deploy ready + AUTON dogfooding 開始
- **Phase 3 → 4**: empirical data 取得完了 + 論文 submission + grant 総額 $50K+ 確定
- **Phase 4 → SaaS GO**: PMF signal 閾値クリア (active agents N ≥ 100, weekly tx volume ≥ $5K USDT [first candidate threshold、Phase 3 中盤に Phase 4 GO/NO-GO meeting で確定], GitHub stars 500+)

## 13. Open Questions / Decisions Deferred

| # | 問い | いつ決めるか | 決定主体 |
|---|---|---|---|
| OQ-1 | License (Apache 2.0 vs MIT vs dual) | Phase 1 末、public repo push 前 | 社長 + 林 (法務観点) |
| OQ-2 | Plasma mainnet 接続の最終構成 (RPC provider, indexer) | Phase 2 中 | 社長 + Claude Code |
| OQ-3 | Solidity audit firm 選定 (Trail of Bits / OpenZeppelin / Spearbit) | Phase 2 中 | 社長 (見積比較) |
| OQ-4 | ZK audit firm 選定 (Veridise / zkSecurity) | Phase 2 中 | 社長 + 佐藤 |
| OQ-5 | Safe multisig 署名者の最終構成 (内部 only vs 外部 trustee 含む) | Phase 2 開始時 | 社長 + Lead Engineer |
| OQ-6 | QVAC LLM judge の baseline model (Llama 3.1 8B vs smaller) | Phase 2 中 | 社長 + Claude Code (bench) |
| OQ-7 | Dispute resolution Phase 2 構成 (3rd-party audit agent の選定基準) | Phase 2 中盤 | 社長 |
| OQ-8 | Public release timing of SDK (Phase 1 末 vs Phase 2 末 audit 後) | Phase 1 末 | 社長 |
| OQ-9 | VC pitch 開始 timing (Phase 3 末 vs Phase 4 初) | Phase 3 末 | 社長 |
| OQ-10 | positioning 矛盾 ("コンサル会社" vs SaaS pivot) の memory/goals.md 反映タイミング | 本 spec 承認直後 | 社長 (本ブレストで議論済み、後続 task)。writing-plans output は本 deferral を明示的に restate して downstream confusion を防ぐ |
| OQ-11 | Tether co-dev (research) grant の最終額面 ($10-30K range のどこに落ちるか) | Phase 1 末、Paolo Ardoino / Tether ecosystem lead 直接交渉時 | 社長 |

## 14. References

### 14.1 Prime Beat internal

- `~/.claude/projects/-Users-shibuyaryuukyou/memory/project_prime_beat_rd_theme_sybil.md`: Whuffie R&D 北極星 (合成研究選択 v3)
- `~/.claude/projects/-Users-shibuyaryuukyou/memory/project_rd_proof_integrated_v1.md`: Theorem 1/2 integrated proof
- `~/.claude/projects/-Users-shibuyaryuukyou/memory/project_rd_empirical_design_v1.md`: empirical 設計
- `~/.claude/projects/-Users-shibuyaryuukyou/memory/project_whuffie_autoresearch_harness.md`: autoresearch harness
- `~/.claude/projects/-Users-shibuyaryuukyou/memory/project_agentic_finance_portfolio.md`: Portfolio 再評価 (2026-04-13)
- `~/.claude/projects/-Users-shibuyaryuukyou/memory/project_auton_program.md`: AUTON Program 概要
- `~/Documents/PrimeBeat-Vault/10-Company/goals.md`: 今期目標 (1 億売上、Phase 1/2 ロードマップ)
- `~/Documents/PrimeBeat-Vault/10-Company/philosophy.md`: AI ネイティブ設計原則

### 14.2 External

- Tether Developer Grants Program: https://tether.dev
- Tether QVAC / WDK / MDK / Pears stack
- Risc0 zkVM: https://www.risczero.com/
- zkPassport: https://zkpassport.id/
- Worldcoin: https://worldcoin.org/
- CrewAI: https://github.com/joaomdmoura/crewAI
- Anthropic Claude Agent SDK
- EF Privacy & Scaling Explorations: https://pse.dev/
- Hu & Chen (2025) "Insured Agents": Whuffie 補完関係 (Prime Beat ADR-001 で正面対比)
- Bahrani-Garimidi-Roughgarden (2024) "Sybil-Proof Transaction Fee Mechanisms": Theorem 1 構造的踏襲根拠

---

**Spec status**: draft (2026-05-11). 承認後 `writing-plans` skill で実装計画に展開する。
