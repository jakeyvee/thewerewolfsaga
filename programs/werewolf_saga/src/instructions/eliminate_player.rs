use anchor_lang::prelude::*;

use crate::{
    contexts::EliminatePlayer,
    errors::WerewolfError,
    states::{Game, PeriodType, PlayProof, RoleType, StatusType},
};

pub fn handler(ctx: Context<EliminatePlayer>) -> Result<()> {
    let game_status = Game::read_status(ctx.accounts.game.status)?;
    if game_status != StatusType::ONGOING {
        return Err(WerewolfError::GameInactive.into());
    }

    let game_period = Game::read_period(ctx.accounts.game.period)?;
    if game_period == PeriodType::NIGHT {
        return Err(WerewolfError::WrongPeriod.into());
    }

    let mut vote_counts_sum: u8 = 0;
    let mut max_index: u8 = 0;
    let mut max_value = ctx.accounts.game.vote_counts[0];

    for (index, &value) in ctx.accounts.game.vote_counts.iter().enumerate() {
        if value > max_value {
            max_value = value;
            max_index = index as u8;
        }
        vote_counts_sum += value;
    }

    if vote_counts_sum != (ctx.accounts.game.total_players - ctx.accounts.game.dead_players) {
        return Err(WerewolfError::MissingVotes.into());
    }

    if ctx.accounts.player_proof.pos != (max_index + 1) {
        return Err(WerewolfError::WrongPlayerProof.into());
    }

    ctx.accounts.player_proof.dead = true;
    ctx.accounts.game.dead_players += 1;
    ctx.accounts.game.set_period(PeriodType::NIGHT);
    ctx.accounts.game.round += 1;
    ctx.accounts.game.turn = 0;
    ctx.accounts.game.vote_counts = [0u8; 255];

    let player_role = PlayProof::read_role(ctx.accounts.player_proof.role)?;
    if player_role == RoleType::WOLF {
        ctx.accounts.game.set_status(StatusType::COMPLETED);
        ctx.accounts
            .game
            .set_winner_role(RoleType::VILLAGER | RoleType::SEER);
    }

    Ok(())
}
