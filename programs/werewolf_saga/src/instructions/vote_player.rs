use anchor_lang::prelude::*;

use crate::{
    contexts::VotePlayer,
    errors::WerewolfError,
    states::{Game, PeriodType, StatusType},
};

pub fn handler(ctx: Context<VotePlayer>) -> Result<()> {
    let game_status = Game::read_status(ctx.accounts.game.status)?;
    if game_status != StatusType::ONGOING {
        return Err(WerewolfError::GameInactive.into());
    }

    let game_period = Game::read_period(ctx.accounts.game.period)?;
    if game_period == PeriodType::NIGHT {
        return Err(WerewolfError::WrongPeriod.into());
    }

    if ctx.accounts.voter_proof.dead | ctx.accounts.player_proof.dead {
        return Err(WerewolfError::AlreadyDead.into());
    }

    ctx.accounts.game.vote_counts[(ctx.accounts.player_proof.pos - 1) as usize] += 1;
    ctx.accounts.game.turn += 1;

    Ok(())
}
