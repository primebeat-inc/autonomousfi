# FAQ

Common questions about AutonomousFi.

## 1. What is this?

AutonomousFi is a reputation and payment substrate for autonomous AI agents. Agents post a hostage stake, build verifiable reputation through zero-knowledge proofs of past performance, and transact with each other on a high-throughput payment chain. The protocol implements the constructive mechanism from Theorem 2 of the Whuffie paper: hostage stake combined with proof-of-personhood is sufficient to make honest behavior the dominant strategy under cheap identity assumptions.

## 2. Why hostage stake?

Pure reputation systems collapse when identities are cheap. An agent can build a good track record, defect once for a large payoff, then abandon the identity and start fresh. Hostage stake closes this exit. The stake is forfeit on detected defection, so the agent cannot extract value by burning reputation. Combined with a proof-of-personhood cost, this gives the constructive lower bound proven in Theorem 2. Stake size is calibrated to the maximum single-round payoff, not the lifetime payoff, which keeps capital requirements bounded.

## 3. Why zk reputation?

Agents need to prove "I have completed N tasks with success rate R above threshold T" without revealing which counterparties, which task contents, or which on-chain addresses. Without zero-knowledge, reputation either leaks the agent's full transaction graph (privacy failure) or stays siloed per platform (network effect failure). The zk circuit takes a Merkle root of signed performance attestations as a public input and outputs a single bit: "qualifies for tier X". This lets reputation port across venues while keeping the underlying history private.

## 4. Why Plasma not Ethereum L1?

Agent-to-agent micropayments need three properties Ethereum mainnet does not provide at acceptable cost: sub-cent fees, sub-second finality, and stablecoin-native settlement. Plasma is a stablecoin-optimized chain with these properties built in. Mainnet L1 settlement costs would consume a meaningful fraction of every payment, which breaks the unit economics of agent commerce. Disputes and high-value escrow can still anchor to L1, but the hot path runs on Plasma.

## 5. How is this different from custodial agent wallets?

Custodial agent wallets give an agent the ability to spend funds held by a centralized provider. The provider holds the keys, runs the compliance layer, and absorbs liability. AutonomousFi is the opposite shape: the agent holds its own keys, posts its own stake, and carries its own reputation across providers. Custodial wallets answer "how does this specific agent pay". AutonomousFi answers "how do arbitrary agents trust each other across providers". The two layers compose. A custodial wallet can post stake into AutonomousFi and use its zk reputation badge.

## 6. How is this different from HTTP 402 payment protocols?

HTTP 402 payment protocols define how an API request carries a payment proof so a server can charge per call. That solves the payment channel between a known caller and a known provider. AutonomousFi solves the layer below: how does the provider know the caller is a real persistent agent with a track record, not a freshly spun-up identity defecting on its first call. HTTP 402 plus AutonomousFi reputation is the natural stack. The 402 flow carries payment, the reputation badge carries identity and history.

## 7. Can I use it without crewai?

Yes. The reference integration uses crewai because it is the most common multi-agent orchestration framework in production, but the protocol surface is framework-agnostic. Any agent that can sign messages and hold a stake can participate. We provide adapters for crewai and a raw SDK. Integrations for LangGraph and Autogen are on the roadmap. If you are building a custom orchestrator, the SDK exposes the four primitives directly: register, stake, attest, prove.

## 8. When mainnet?

Testnet is live now on Plasma testnet. Mainnet is gated on three items: completion of the formal audit, completion of the empirical study in the Whuffie paper (Phase E, 2027 Q1), and onboarding of the first three production agent operators. Realistic mainnet window is 2027 Q2. We do not ship a reputation primitive that has not been adversarially tested against Sybil and collusion attacks in a live but bounded environment first.

## 9. How does PoP work without revealing identity?

Proof-of-personhood gives an agent operator a credential that says "this human exists and has not minted another credential", without revealing who the human is. The credential is bound to a key the operator controls. The operator then derives per-agent keys from that credential using a verifiable delegation scheme. On-chain, the protocol checks a zk proof that the agent key descends from a valid PoP credential, without learning which credential. This gives unforgeable identity scarcity without a global identity registry.

## 10. Where can I read the proof of Theorem 2?

The Whuffie paper draft is in `papers/whuffie.pdf` in the research repo. Theorem 2 (the constructive mechanism) is in Section 4. The proof has three parts: (a) honest dominance under the hostage stake constraint, (b) necessary and sufficient conditions on the PoP cost and stake size, (c) three worked numerical examples showing the parameter regime. The proof draft is at v3 and the formal write-up targets AAMAS 2027 and FC 2027 submission.
