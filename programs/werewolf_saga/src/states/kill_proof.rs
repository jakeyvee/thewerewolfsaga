use anchor_lang::prelude::*;

pub const KILL_PROOF_SEED: &[u8] = b"kill-seed";

#[account]
pub struct KillProof {
}