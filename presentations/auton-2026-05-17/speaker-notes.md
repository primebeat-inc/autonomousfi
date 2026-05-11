# AUTON 2026-05-17 Speaker Notes

**Talk**: The Whuffie Problem in Practice
**Speaker**: 渋谷 竜響 (Prime Beat 株式会社)
**Total budget**: 25-30 分 (本編 25 分 + デモ 5 分 + Q&A 5 分)
**Audience**: AUTON 共催各社 (SMBC日興 / 東大IPC / Fracton Ventures / Next Finance Tech) + 採択スタートアップ + 招待ゲスト

---

## 全体的な話し方のメモ

- ペースは「やや早め」。30 分で 11 枚なので 1 枚平均 2-3 分
- 学生 + 学者 + 大手金融 + スタートアップ起業家が混在しているので、専門用語は使うが必ず 1 文で言い換える
- 「Web3」「Web2」「歴史的類推」は一切使わない。代替語: クリプト、オンチェーン、Agentic Finance
- 競合他社名 (DeFimans / HashPort 等) は出さない。「大手ファーム」「従来型」
- エムダッシュ・グラデーション禁止 (これは slide 側でも反映済み)
- 自信を持って話す。研究者であり実装者であり共催者という 3 つのレイヤーを毎枚で立てる

---

## Slide 別ノート

### Cover slide (~30 秒)

- 「Prime Beat 渋谷です。AUTON Program の共同主催者の 1 社として、本日のキックオフ場をお借りしてプロダクト発表とリサーチプレビューを兼ねた登壇をさせていただきます」
- 一礼してから次へ
- 観客反応: 注目度を見る。スマホ触ってる人が多いなら導入を強くする
- **時間予算**: 0:30

### Slide 1: なぜこの登壇か (~2 分)

- 「AUTON は SMBC日興・東大IPC・Fracton・Next Finance Tech・Prime Beat の 5 者共催。ここに採択スタートアップが入って 6 chamber 構造になる」
- 「Prime Beat は単独運営パートナーではなく、研究と実装の両輪で AUTON にコミットする立場」
- 「今日扱うのは 1 つの core 問題: AI エージェントが評判を通貨にできるか」
- 「結論を先に: 純粋には不可能。しかし構成的に回避できる。その実装を本日公開する」
- **時間予算**: 2:30 (累計 3:00)

### Slide 2: The Whuffie Problem (research preview) (~3 分)

- Doctorow の小説の話は短く。1 文で背景、1 文で問題定義
- 「formal restatement の中身は: 評判だけが通貨なら、low rep の actor は捨て ID を作って再参入できるので honest dominant にならない」
- 「証明の中身は本日省略する。AAMAS 2027 / FC 2027 投稿予定の論文に書いてある」
- 「これは Prime Beat の R&D 北極星」と一言入れる (会社としての本気度を示す)
- 観客反応: 学者陣がメモを取ったか確認
- **時間予算**: 3:00 (累計 6:00)

### Slide 3: なぜ放置できないか (~3 分)

- 「AI agent は人間より桁違いに安く・速く増やせる。これが core の状況変化」
- 「Insured Agents や Sybil-Proof TFM は補完的だが、評判を通貨化したい本来の問いには答えていない」
- 「ここに学術的空白があり、産業的緊急性がある」
- 採択スタートアップに対して: 「皆さんがこれから 3 ヶ月で作るプロダクトの全てが、この問題と無関係ではない」
- **時間予算**: 3:00 (累計 9:00)

### Slide 4: 構成的解の概略 (Theorem 2) (~3 分)

- 「我々の答えは PoP × Hostage hybrid mechanism、M_H と呼ぶ」
- 「2 つの要素を同時に立てる」の部分は声を強くする
- PoP の説明: 「1 人間につき 1 attestation。zkPassport がパスポート由来、Worldcoin が orb 由来」
- Hostage stake の説明: 「事前の経済担保。failure 時に slash」
- 「両方同時で honest dominant になる。これが Theorem 2」
- 「補完関係ではなく構造変更」と強調
- **時間予算**: 3:00 (累計 12:00)

### Slide 5: AutonomousFi Agent の紹介 (~2 分)

- 「ここからは実装の話。本日 GitHub で public 化する」
- スタックを一気に読み上げる: QVAC + WDK + Plasma + Risc0 + zkPassport
- 「Tether の縦統合スタックの上に zk と PoP を載せた構成」
- 「5/12 に spec freeze、本日 public」と続けて、開発速度を示す
- 観客反応: Tether 系の単語で SMBC日興 / 大手金融側の反応を確認
- **時間予算**: 2:00 (累計 14:00)

### Slide 6: アーキテクチャ概観 (4-layer) (~3 分)

- 4 layer を上から順に説明
- SDK Layer: 「`@paid_agent` decorator が 1 行で関数を有償サービス化する。エンジニアにとっての DX が最優先」
- Protocol Layer: 「Solidity 0.8、OpenZeppelin upgradeable proxy、audit 後に freeze」
- ZK Layer: 「履歴を公開せずに『N 件以上 × 品質閾値以上』を証明する。これが privacy preserving reputation の本質」
- Reputation Layer: 「ローカルで動く LLM judge。集約 proof だけがオンチェーン」
- 「**異なる audit firm 発注**」は強調。プロのお金の人 (SMBC日興 / Next Finance Tech) に響くポイント
- **時間予算**: 3:00 (累計 17:00)

### Slide 7: ライブデモ (5 分)

- ここで slide を一旦切り替え、デモ画面に移る
- 30 秒以内の決済 flow を実演
- 失敗ケース (hostage slash) も同様に実演
- **デモが落ちたら**: 録画版を再生する。落ち着いて「ここで録画に切り替えます」
- **デモ中の解説**: 「now A が escrow lock、B が stake、submit、judge、settle」をリアルタイムで言う
- **時間予算**: 5:00 (累計 22:00)

### Slide 8: なぜ AUTON で発表するのか (~2 分)

- AUTON 6 テーマと Prime Beat 蓄積の対応を 1 文で
- 「採択チームへの直接依頼」を強調: ドッグフーディングの最初のユーザーになってほしい
- 「Prime Beat 側のリターン」も明示することで対等な共同研究の雰囲気を作る
- 共著オファーは慎重に言う (実際には個別交渉)
- **時間予算**: 2:00 (累計 24:00)

### Slide 9: ロードマップ概観 (~2 分)

- Phase 1-4 を一気に
- 「Phase 2 で監査 $100K 規模」「Phase 3 で 50+ agent 実証」「Phase 4 で SaaS pivot 判断 or 研究 artifact」
- 「並行で Tether Developer Grants + EF PSE + Optimism RetroPGF を応募する。audit 費は grant で吸収する」
- 観客反応: VC 観点での Q&A を促す
- **時間予算**: 2:00 (累計 26:00)

### Slide 10: オープンコール (~1.5 分)

- 4 種類の呼びかけ:
  1. GitHub (全員)
  2. AUTON 採択スタートアップ
  3. 商業企業 (Tech Partner / Joint R&D)
  4. 研究者 (論文 / 共同実証)
- 連絡先を読み上げる (DM 来てもらう体勢)
- 「トークン発行有無を問わず」は省略可 (memory rule で「わざわざ言わない」)。代わりに「ブロックチェーン活用に踏み込みたい企業様」で包む
- **時間予算**: 1:30 (累計 27:30)

### Slide 11: 質疑応答 (~5 分)

- 想定論点 4 つを声に出して読まず、画面に出すだけ
- 質問が出ない場合は「PoP の地域依存性についてはどうお考えですか」と自問自答で誘導
- 大手金融 / VC 系の質問が出たら、Phase 4 (SaaS pivot or research) の話に寄せる
- 学者の質問が出たら、Theorem 1/2 の証明戦略に寄せる
- 採択チームの質問が出たら、3 ヶ月の Joint R&D の動き方に寄せる
- **時間予算**: 5:00 (累計 32:30、超過可)

---

## 観客反応のウォッチポイント

- 「PoP」と言ったときに学者陣が頷く / 大手金融が顔を上げるか
- 「hostage slash」のデモで起業家が前のめりになるか
- 「dual audit firm」で SMBC日興 / Next Finance Tech が頷くか
- 「$100K grant」で VC 陣が反応するか

## 触れない / 飛ばすべきこと

- Tether co-dev grant の最終金額 (まだ交渉中、OQ-11)
- License 選定 (Apache 2.0 vs MIT vs dual、OQ-1、Phase 1 末確定)
- Safe multisig 署名者構成 (内部議論中、OQ-5)
- SaaS pivot 確定の話 (Phase 4 判断、まだ open question)

## Q&A で困ったときの逃げ道

- 「それは spec の OQ-X として明示的に open question として扱っている。決定 timing は Phase 2 中盤」
- 「論文 v3 のセクション Y にて詳述しているので、メール後追いで送らせてください」
- 「Prime Beat の共同主催者として、AUTON 採択チームと 3 ヶ月で深掘りしたい論点です」

---

## 終演後の動き

- 名刺交換は Tether / SMBC日興 / Next Finance Tech / 採択チーム代表を優先
- 翌日中に `presentations/auton-2026-05-17/demo-recording.md` を更新 (本ファイルは事後 CEO 入力)
- 1 週間以内に GitHub repo に AUTON 視聴者向け Issue テンプレート追加
