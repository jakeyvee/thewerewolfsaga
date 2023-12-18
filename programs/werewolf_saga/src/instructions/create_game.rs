use anchor_lang::{prelude::*, solana_program::clock};

use crate::contexts::CreateGame;

pub fn handler(ctx: Context<CreateGame>) -> Result<()> {
    let time_now: u64 = clock::Clock::get()?.unix_timestamp.try_into().unwrap();
    ctx.accounts.game.initialize(ctx.accounts.organiser.key(), time_now);

    Ok(())
}
