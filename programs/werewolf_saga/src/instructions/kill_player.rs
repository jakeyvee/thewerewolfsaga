use anchor_lang::prelude::*;

use crate::{
    contexts::KillPlayer,
    errors::WerewolfError,
    states::{Game, PeriodType, PlayProof, RoleType, StatusType},
};

pub fn handler(ctx: Context<KillPlayer>) -> Result<()> {
    let game_status = Game::read_status(ctx.accounts.game.status)?;
    if game_status != StatusType::ONGOING {
        return Err(WerewolfError::GameInactive.into());
    }

    let game_period = Game::read_period(ctx.accounts.game.period)?;
    if game_period == PeriodType::DAY {
        return Err(WerewolfError::WrongPeriod.into());
    }

    let wolf_role = PlayProof::read_role(ctx.accounts.wolf_proof.role)?;
    if wolf_role != RoleType::WOLF {
        return Err(WerewolfError::WrongRole.into());
    }

    if ctx.accounts.villager_proof.dead {
        return Err(WerewolfError::AlreadyDead.into());
    }

    ctx.accounts.villager_proof.dead = true;
    ctx.accounts.game.dead_players += 1;
    ctx.accounts.game.set_period(PeriodType::DAY);

    if (ctx.accounts.game.total_players - ctx.accounts.game.dead_players) <= 2 {
        ctx.accounts.game.set_status(StatusType::COMPLETED);
        ctx.accounts.game.set_winner_role(RoleType::WOLF);
    }
    Ok(())
}
