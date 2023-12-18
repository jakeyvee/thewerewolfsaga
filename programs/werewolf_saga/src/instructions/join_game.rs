use anchor_lang::prelude::*;

use crate::contexts::JoinGame;

pub fn handler(ctx: Context<JoinGame>) -> Result<()> {
    ctx.accounts.game.increment_total_players()?;
    ctx.accounts.play_proof.initialize(
        ctx.accounts.player.key(),
        ctx.accounts.game.get_total_players(),
    );

    Ok(())
}
