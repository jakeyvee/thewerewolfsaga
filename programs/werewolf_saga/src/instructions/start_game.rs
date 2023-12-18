use crate::contexts::StartGame;
use anchor_lang::prelude::*;
pub fn handler(ctx: Context<StartGame>) -> Result<()> {
    ctx.accounts.game.start_game()?;
    Ok(())
}
