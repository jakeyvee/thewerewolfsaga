use anchor_lang::prelude::*;

pub const VOTE_PROOF_SEED: &[u8] = b"vote-seed";

#[account]
pub struct VoteProof {
}