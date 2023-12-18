use anchor_lang::prelude::*;

use crate::states::*;

#[derive(Accounts)]
#[instruction(game_name: String)]
pub struct CreateGame<'info> {
    #[account(mut)]
    pub organiser: Signer<'info>,
    #[account(
      init, 
      seeds = [game_name.as_bytes().as_ref()],
      bump,
      payer = organiser,
      space = 8 + std::mem::size_of::<Game>()
    )]
    pub game: Account<'info, Game>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}