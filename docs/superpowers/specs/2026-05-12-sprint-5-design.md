# Sprint 5 Design: zkPassport Integration + PoP-Gated Discovery + Worldcoin Fallback

## Sprint 5 Goal
Integrate real zkPassport SDK as primary PoP source, Worldcoin as fallback; gate provider discovery on valid PoP attestation.

## Window
2026-07-07 to 2026-07-19.

## Sub-tasks
- zkPassport SDK install and browser integration (npm package wiring, WebAuthn / NFC passport read flow in the provider onboarding UI, environment config for testnet vs dev).
- Attestation flow: zkPassport claim signing produces a nullifier + signed claim, which is fed into the Risc0 `pop_attestation` circuit; circuit emits a proof consumed by the on-chain PoP verifier contract that mints a non-transferable PoP attestation NFT bound to the provider address.
- Worldcoin SDK as fallback adapter: implement `WorldcoinPopAdapter` behind the same `ZkPoPProvider` interface so the same downstream verifier and discovery gate accept either source. Worldcoin path activates only when zkPassport returns unsupported-document or unsupported-region.
- `ZkPoPProvider` client unified interface: TypeScript abstraction with two adapters (`ZkPassportPopAdapter`, `WorldcoinPopAdapter`); both expose `requestAttestation()`, `getProof()`, `getNullifier()`, `getSourceTag()`; downstream consumers (registration UI, discovery filter, contract caller) depend only on the interface.
- End-to-end: provider can register only if PoP valid (registry contract reverts on missing or expired attestation); requester can discover only PoP-attested providers (off-chain indexer filters by attestation status; on-chain view function returns attested set).
- Real QVAC LLM judge integration (Llama 3.1 8B baseline per spec sec 5.1): wire the judge service to the score aggregation path so attestation-gated providers route through the production judge instead of the mock used in Sprint 4.

## Acceptance gates
- zkPassport flow end-to-end on testnet: a fresh wallet completes passport read, generates proof, verifier accepts, attestation NFT minted, registry recognises it.
- Worldcoin fallback path tested in dev mode: forced-fallback dev flag triggers Worldcoin adapter, attestation accepted by the same verifier, registry treats it as equivalent.
- PoP-gated discovery rejects unattested providers: discovery endpoint and on-chain view both return empty for unattested addresses; registration call reverts.
- 1 human = 1 attestation invariant verified: the nullifier index prevents the same passport (or same Worldcoin orb-verified human) from registering two distinct provider addresses; integration test asserts second attempt reverts with `NullifierAlreadyUsed`.

## Out of scope
- Mainnet zkPassport deploy (Sprint 6).
- Production QVAC model selection (deferred to Sprint 6+; Sprint 5 locks the Llama 3.1 8B baseline only).
- Regulatory review of PoP sources (parallel legal track, not blocking this sprint).

## Dependencies
- Sprint 4 circuits compiled (`pop_attestation` Risc0 circuit produces verifiable proofs).
- Testnet deploy live (registry, verifier, and indexer endpoints reachable from the provider and requester apps).
