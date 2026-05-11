# ADR 0001: u32 1e6 Fixed-Point Score Encoding

## Status

Accepted (2026-05-11)

## Context

The scoring pipeline spans two distinct execution environments: a TypeScript orchestration layer (which historically used `f64` / JavaScript `number` for score arithmetic) and a Rust zkVM guest that must produce a byte-identical score commitment for on-chain verification.

Floating-point representations diverge across these environments in ways that break determinism required for zero-knowledge proofs:

1. IEEE 754 `f64` operations are not guaranteed to produce identical bit patterns across the V8 JIT and the zkVM's Rust runtime, particularly around denormals, subnormal flushing, and transcendental functions.
2. NaN and signed-zero representations have no canonical encoding for hashing or Merkle commitment.
3. Solidity has no native floating-point type. Any on-chain verifier consuming the score must work with integer types.
4. The current TypeScript stub (see `quality.ts` `STUB_FAILURE_SCORE`) already implicitly assumes an integer score domain, but the encoding is not formally specified.

Without a canonical fixed-point encoding shared by all three layers (TS orchestrator, Rust guest, Solidity verifier), the score commitment computed off-chain cannot be reliably reproduced inside the zkVM or validated on-chain.

See spec section 7.1 for the broader score commitment scheme that this ADR underpins.

## Decision

Encode all quality scores as `u32` fixed-point values scaled by `1_000_000` (1e6).

- **Type**: `u32` (Rust), `number` constrained to `uint32` semantics (TypeScript), `uint32` (Solidity).
- **Scale**: 1 unit of the underlying score (e.g. probability 1.0, or normalized quality 1.0) equals `1_000_000`.
- **Domain**: closed interval `[0, 1_000_000]`. Values outside this range MUST be clamped at the encoding boundary before commitment.
- **Precision**: 6 decimal digits.
- **Failure sentinel**: continues to be expressed as a value inside the valid range (e.g. `STUB_FAILURE_SCORE = 0` in `quality.ts`), not as an out-of-band NaN.

All three layers (TypeScript orchestrator, Rust zkVM guest, Solidity verifier) MUST use this identical encoding. Any function that produces a score returns the encoded `u32`; any function that consumes a score expects the encoded `u32`.

## Consequences

### Positive

- **Deterministic across environments**. Integer arithmetic on `u32` is bit-identical in V8, Rust, and the EVM, eliminating the divergence risk that motivated this ADR.
- **Byte-aligned with Solidity**. `uint32` slots into Solidity storage and calldata without conversion, and the score commitment can be verified on-chain using native EVM opcodes.
- **Simple to verify inside the zkVM guest**. No floating-point intrinsics required, no need to import or audit a fixed-point math crate beyond standard integer ops.
- **Canonical encoding for hashing**. No NaN, no signed zero, no denormals. The commitment over the score is unambiguous.
- **Cross-references cleanly**. `quality.ts` `STUB_FAILURE_SCORE` is already an integer in this domain, so no migration required for the failure path.

### Negative

- **6 digits of precision only**. Scores requiring more than 6 decimal places of resolution cannot be represented. This is judged sufficient for quality scoring use cases but rules out applications requiring finer granularity.
- **No NaN representation**. Pipelines that previously relied on NaN to signal "no score available" must use an explicit sentinel value or a separate flag. The codebase convention is to use `0` as the failure sentinel, matching `STUB_FAILURE_SCORE`.
- **Requires explicit clamp**. Producers must clamp inputs to `[0, 1_000_000]` before encoding. Out-of-range inputs silently saturating could mask bugs, so the clamp SHOULD log or assert in debug builds.

## References

- Spec section 7.1 (score commitment scheme)
- `quality.ts` `STUB_FAILURE_SCORE` constant
