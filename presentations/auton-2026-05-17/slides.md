---
title: The Whuffie Problem in Practice
author: 渋谷 竜響 (Prime Beat 株式会社)
date: 2026-05-17
event: AUTON Program 2026 Kickoff
marp: true
theme: default
paginate: true
---

# The Whuffie Problem in Practice

## AI エージェント経済の信用問題と、その構成的解の実装

渋谷 竜響 / Prime Beat 株式会社

AUTON Program 2026 Kickoff / 2026年5月17日

---

## 1. なぜこの登壇か (Why this talk)

- AUTON Program は SMBC日興証券・東大IPC・Fracton Ventures・Next Finance Tech・Prime Beat の 5者共催。本日は Prime Beat 共同主催者としての所信表明を兼ねる
- 「AI エージェントが別の AI エージェントに価値を払い、信用を積む」経済が立ち上がる前夜、core 問題を一つだけ取り上げて晒し、その構成的解を提示したい
- 本日紹介する **AutonomousFi Agent** は論文だけの話ではなく、本日 GitHub で public 化する稼働コードである
- 採択スタートアップとの 3 ヶ月間で、Prime Beat は「ベンダー」ではなく「共同研究開発パートナー (Joint R&D)」として組みたい

---

## 2. The Whuffie Problem (research preview)

- **元ネタ**: Cory Doctorow が 2003 年の小説 "Down and Out in the Magic Kingdom" で描いた reputation 通貨 "Whuffie"。お金が消え、評判が経済を回す世界
- **formal restatement**: cheap identity (本人確認コストが極めて低い状況) の下では、純粋な reputation 経済はインセンティブ整合的に成立しない
- **Theorem 1 (Whuffie 不可能性)** の直観: 評判だけを通貨にすると、低評判の actor は使い捨て ID を作って再参入する選択肢を必ず持ってしまい、honest が dominant strategy にならない
- 証明の詳細は本日省略、Prime Beat R&D 北極星として 2027 年 AAMAS / FC に投稿予定の論文に収録

---

## 3. なぜこれは放置できない問題か

- AI エージェントは人間より桁違いに**安く・速く**増やせる。一台数万円のサーバーで 100 体動かせる時代に、1 アカウント=1 actor の前提は崩れる
- 純粋に評判だけで信用を積む仕組みは、cheap identity sybil で必ず崩壊する。これは Doctorow の小説ですら既に予言されていた構造
- 既存の対案は補完的だが個別最適: **Insured Agents** (Hu & Chen 2025) は事後保険、**Sybil-Proof Transaction Fee Mechanisms** (Bahrani-Garimidi-Roughgarden 2024) は手数料側からの sybil-proof 条件
- どちらも「reputation を通貨化したい」という Doctorow の問題そのものには答えていない。ここに学術的空白がある

---

## 4. 構成的解の概略 (Theorem 2)

- 提案メカニズム名: **M_H (PoP × Hostage Hybrid Mechanism)**
- **2 つの要素を同時に立てる**:
  - **PoP (Proof of Personhood)**: 1 人間につき 1 attestation。zkPassport や Worldcoin で実現
  - **Hostage stake**: provider が事前に経済担保を差し入れ、failure 時には slash される
- PoP は「使い捨て ID コスト」を構造的に持ち上げ、hostage は「短期で抜ける利得」を負にする
- 両方が同時に立つと、honest 行動が **dominant strategy** になることを構成的に証明できる (Theorem 2)
- 補完関係でなく、構造変更で問題そのものを回避するアプローチ

---

## 5. AutonomousFi Agent の紹介

- 本日 public 化: `primebeat-inc/autonomousfi` (Apache 2.0 (Phase 1 末確定済み))
- Whuffie 論文 Theorem 2 の構成的メカニズムを「動く SDK」として実装した、agent-to-agent 決済 + 信用基盤
- **縦統合スタック**:
  - **Tether QVAC**: オンデバイスで稼働するローカル LLM judge
  - **Tether WDK**: self-custodial wallet (秘密鍵をユーザー側で保持)
  - **Tether Plasma**: 決済を載せる高速チェーン
  - **Risc0 zkVM**: reputation 集約と PoP attestation の zk proof
  - **zkPassport**: 1 人間 1 attestation を保証
- 2026 年 5 月 12 日 design spec freeze 済み。本日リポジトリ public

---

## 6. アーキテクチャ概観 (4-layer)

- **SDK Layer (TypeScript / Bun)**: エージェント開発者の入口。`@paid_agent` decorator で関数 1 つを「価格 + 担保 + 品質閾値つきサービス」に変換
- **Protocol Layer (Solidity on Plasma)**: trustless な決済と担保管理。EscrowVault / HostageBond / ReputationRegistry / PoPVerifier / ServiceMarketplace の 5 契約
- **ZK Layer (Risc0 zkVM, Rust)**: 履歴を公開せずに「N 件以上 × 品質閾値以上」を証明する reputation_aggregator と、人間性を証明する pop_attestation の 2 回路
- **Reputation Layer (off-chain)**: QVAC ローカル LLM judge が品質を採点。履歴は暗号化ローカル保存。集約証明だけがオンチェーンに公開される
- Solidity と zk circuit は **別々の audit firm に発注** し single firm の盲点を回避する

---

## 7. ライブデモ (5 分)

- 実行物: `demos/agent_to_agent_review.py` (in-memory mock、Phase 1 ステージ)
- **シナリオ**: Agent A (依頼者) が Agent B (provider) に code review を依頼
  - 30 秒以下で escrow lock → 担保 stake → 結果提出 → QVAC judge 採点 → USDT 決済 + reputation 加算 (実測値は数秒)
- **第 2 シナリオ**: provider が意図的に粗悪納品 → judge score 閾値割れ → hostage が依頼者へ slash + reputation failure 記録
- いずれも実時間で確認できる
- ※ 万一現地ネットワーク不調時に備え、同じ flow の録画版を `presentations/auton-2026-05-17/demo-recording.md` 経由で公開予定

---

## 8. なぜ AUTON で発表するのか

- AUTON Program の 6 テーマ (Agent Payments / Credit Scoring / Risk Reviewer / DeFi Agent / Yield Router / Strategy Mirror) いずれも、Prime Beat の研究蓄積と直接接続する
- 採択スタートアップとの 3 ヶ月で深掘りしたいテーマ:
  - Agent Payments の決済レール選定 (USDT primary / 法定通貨 secondary)
  - Credit Scoring における sybil 耐性条件の設計
  - Risk Reviewer における担保 + 評判の組み合わせ最適化
- **採択チームに依頼**: AutonomousFi の最初のドッグフーディングユーザーになってほしい。3 ヶ月で 50+ agent 実測データを共同で取りに行きたい
- Prime Beat 側のリターン: Whuffie 論文の empirical chapter に統計データを反映、共著オファー検討可

---

## 9. ロードマップ概観

- **Phase 1 (2026 年 5-7 月)**: SDK 雛形 (TypeScript, in-memory) + 本日の AUTON 登壇 + GitHub repo public + 30+ stars
- **Phase 2 (2026 年 8-12 月)**: production build + Solidity 監査 + zk circuit 監査 (異なる外部 firm の dual audit)
- **Phase 3 (2027 年 Q1)**: Plasma mainnet 公開 + 50+ agent によるドッグフーディングと sybil simulation + Whuffie 論文 v3 完成 / AAMAS 2027 / FC 2027 投稿
- **Phase 4 (2027 年 Q2 以降)**: SaaS pivot 判断 + VC seed pitch ($500K-1M target) ↔ research artifact 化のどちらかに集中
- 並行: Tether Developer Grants (5 wave) + EF PSE proposal + Optimism RetroPGF を順次応募。audit 費 $100K 規模を grant で吸収

---

## 10. オープンコール (Open Call)

- **GitHub**: `github.com/primebeat-inc/autonomousfi` 本日公開。star / issue / PR 大歓迎
- **AUTON 採択スタートアップ向け**: SDK の早期 access + Prime Beat による 3 ヶ月間の Joint R&D サポート枠を確保。直接お声がけください
- **商業企業向け**: Tech Partner としての Joint R&D 案件、ブロックチェーン活用に踏み込みたい企業の参入支援。Prime Beat 営業窓口 / 渋谷直 DM
- **研究者向け**: Whuffie 論文 draft v3 (proof drafts、empirical 設計) を共有可能。査読・反論・共同実証実験を歓迎
- **連絡先**: tatsunari (at) prime-beat.io / X: @shibutatsu / Discord: tatsunari_shibuya

---

## 11. 質疑応答 (Q&A)

- ご質問・ご批判・お繋ぎ歓迎
- 想定論点:
  - PoP の地域依存性 (zkPassport が対応していない地域、Worldcoin の規制)
  - QVAC LLM judge の判断ブレ (Phase 2 で differential test 予定)
  - 既存の評判システムとの相互運用 (Phase 4 以降の検討事項)
  - SaaS pivot v.s. research artifact 化の意思決定基準

ご清聴ありがとうございました。
