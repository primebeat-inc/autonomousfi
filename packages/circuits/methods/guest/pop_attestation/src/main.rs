#![no_main]
risc0_zkvm::guest::entry!(main);

/// Sprint 4 implements the full PoP attestation circuit per spec sec 7.2.
/// This file is a placeholder so the Cargo workspace builds.
fn main() {
    let _input: u32 = risc0_zkvm::guest::env::read();
    risc0_zkvm::guest::env::commit(&0u32);
}
