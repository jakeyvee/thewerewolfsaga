use anchor_lang::prelude::*;

use super::RoleType;

pub const SIGHT_PROOF_SEED: &[u8] = b"sight-seed";

#[account]
pub struct SightProof {
    pub player: Pubkey,
    pub play_proof: Pubkey,
    pub role: u8,
}

impl SightProof {
    pub fn initialize(&mut self, player: Pubkey, play_proof: Pubkey, role: RoleType) {
        self.player = player;
        self.play_proof = play_proof;
        self.set_role(role);
    }

    pub fn set_role(&mut self, role: RoleType) {
        self.role = role.bits();
    }
}
