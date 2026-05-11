# autonomousfi circuits

Risc0 zkVM workspace. Sprint 4 starts the actual circuit implementation here; this directory currently contains only the scaffold.

## License

Apache-2.0.

## Layout

```
packages/circuits/
  Cargo.toml                                  workspace root
  host/                                       host driver (proving, verification, integration)
  methods/                                    guest methods builder
    build.rs                                  invokes risc0_build::embed_methods()
    guest/
      reputation_aggregator/                  circuit 1 (placeholder for Sprint 4)
      pop_attestation/                        circuit 2 (placeholder for Sprint 4)
```

## Circuits planned for Sprint 4

1. `reputation_aggregator` (spec sec 7.1): aggregates per-task reputation deltas across N tasks into a single succinct public output. Verifies signatures on each delta and enforces the aggregator's commit equation.
2. `pop_attestation` (spec sec 7.2): attests a Proof of Personhood credential without leaking identity. Produces a nullifier and a per-epoch tag.

## Test gates (Sprint 4 acceptance)

The Sprint 4 first commit must satisfy:

- Line coverage >= 95% across both circuits.
- 100% coverage on every public output path (the journal commit code paths cannot be uncovered).
- Property tests for both circuits (proptest crate). Reputation aggregator: associativity and order-independence of the aggregation. PoP attestation: nullifier uniqueness given the same input, distinct nullifiers across epochs.
- Proving time benchmark: aggregator with N=100 tasks proves in under 60 seconds on a developer Mac (M-series, dev mode acceptable for the bench; final figure recorded for release mode separately).

## Build notes

`cargo build` is intentionally NOT executed in this scaffold cycle. Sprint 4's first commit performs the initial build after the engineer has run:

```
cargo install cargo-risczero
cargo risczero install
```

The scaffold is structured so that, once those tools are installed, a future engineer can run `cargo build` from this directory and proceed.

## References

- Spec: see Sprint 4 design document (sec 7.1 reputation aggregator, sec 7.2 PoP attestation).
- Risc0 docs: https://dev.risczero.com/api
