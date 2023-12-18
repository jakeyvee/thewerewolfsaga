use anchor_lang::prelude::*;

use crate::errors::WerewolfError;

bitflags::bitflags! {
    #[derive(PartialEq)]
    pub struct RoleType: u8 {
        const UNKNOWN = 1 << 0; // can accept new players
        const VILLAGER = 1 << 1;  // can execute game actions
        const SEER = 1 << 2;   // can collect rewards
        const WOLF = 1 << 3;   // can collect rewards
    }
}

#[account]
pub struct PlayProof {
    pub player: Pubkey,
    pub pos: u8,
    pub dead: bool,
    pub role: u8,
}

impl PlayProof {
    pub fn initialize(&mut self, player_key: Pubkey, pos: u8) {
        self.player = player_key;
        self.pos = pos;
        self.dead = false;
        self.set_role(RoleType::UNKNOWN);
    }

    pub fn read_role(status: u8) -> Result<RoleType> {
        RoleType::from_bits(status).ok_or(WerewolfError::InvalidRole.into())
    }

    pub fn set_role(&mut self, role: RoleType) {
        self.role = role.bits();
    }
}
