use anchor_lang::prelude::*;

use crate::{
    contexts::SeePlayer,
    errors::WerewolfError,
    states::{Game, PlayProof, RoleType, StatusType},
};

pub fn handler(ctx: Context<SeePlayer>) -> Result<()> {
    let game_status = Game::read_status(ctx.accounts.game.status)?;
    if game_status != StatusType::ONGOING {
        return Err(WerewolfError::GameInactive.into());
    }

    let seer_role = PlayProof::read_role(ctx.accounts.seer_proof.role)?;
    if seer_role != RoleType::SEER {
        return Err(WerewolfError::WrongRole.into());
    }

    if ctx.accounts.player_proof.dead | ctx.accounts.seer_proof.dead {
        return Err(WerewolfError::AlreadyDead.into());
    }

    let player_role = PlayProof::read_role(ctx.accounts.player_proof.role)?;

    ctx.accounts.sight_proof.initialize(
        ctx.accounts.player.key(),
        ctx.accounts.player_proof.key(),
        player_role,
    );

    Ok(())
}
