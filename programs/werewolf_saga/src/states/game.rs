use crate::errors::WerewolfError;
use anchor_lang::prelude::*;

use super::RoleType;

bitflags::bitflags! {
    #[derive(PartialEq)]
    pub struct StatusType: u8 {
        const OPEN = 1 << 0; // can accept new players
        const ONGOING = 1 << 1;  // can execute game actions
        const COMPLETED = 1 << 2;   // can collect rewards
    }

    #[derive(PartialEq)]
    pub struct PeriodType: u8 {
        const DAY = 1 << 0;
        const NIGHT = 1 << 1;
    }
}

pub const GAME_LEN: usize = 8     // ANCHOR DISCRIMINATOR
    + 32                                    // ORGANISER WALLET KEY
    + 2
    + 2
    + 2
    + 1
    + 1
    + 8;

#[account]
pub struct Game {
    pub organiser: Pubkey,
    pub total_players: u8,
    pub dead_players: u8,
    pub wolf_pos: u8,
    pub seer_pos: u8,
    pub turn: u8,
    pub round: u8,
    pub status: u8,
    pub period: u8,
    pub winner_role: u8,
    pub vote_counts: [u8; 255],
    pub created_at: u64,
}

impl Game {
    pub fn initialize(&mut self, organiser_key: Pubkey, created_at: u64) {
        self.organiser = organiser_key;
        self.total_players = 0;
        self.dead_players = 0;
        self.turn = 0;
        self.round = 0;
        self.set_status(StatusType::OPEN);
        self.set_period(PeriodType::DAY);
        self.set_winner_role(RoleType::UNKNOWN);
        self.vote_counts = [0u8; 255];
        self.created_at = created_at;
    }

    pub fn start_game(&mut self) -> Result<()> {
        let game_status = Game::read_status(self.status)?;
        if game_status == StatusType::OPEN {
            self.round = 1;
            // TODO: randomise and hash
            self.wolf_pos = self.total_players;
            // TODO: randomise and hash
            self.seer_pos = self.wolf_pos - 1;
            self.set_status(StatusType::ONGOING);
            self.set_period(PeriodType::NIGHT);

            Ok(())
        } else {
            Err(WerewolfError::GameStarted.into())
        }
    }

    pub fn increment_total_players(&mut self) -> Result<()> {
        let game_status = Game::read_status(self.status)?;
        if game_status == StatusType::OPEN {
            self.total_players += 1;
            Ok(())
        } else {
            Err(WerewolfError::GameStarted.into())
        }
    }

    pub fn get_total_players(&mut self) -> u8 {
        self.total_players
    }

    pub fn read_status(status: u8) -> Result<StatusType> {
        StatusType::from_bits(status).ok_or(WerewolfError::InvalidStatus.into())
    }

    pub fn set_status(&mut self, status: StatusType) {
        self.status = status.bits();
    }

    pub fn read_period(period: u8) -> Result<PeriodType> {
        PeriodType::from_bits(period).ok_or(WerewolfError::InvalidPeriod.into())
    }

    pub fn set_period(&mut self, period: PeriodType) {
        self.period = period.bits();
    }

    pub fn read_winner_role(status: u8) -> Result<RoleType> {
        RoleType::from_bits(status).ok_or(WerewolfError::InvalidRole.into())
    }

    pub fn set_winner_role(&mut self, role: RoleType) {
        self.winner_role = role.bits();
    }
}
