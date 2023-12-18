use anchor_lang::prelude::*;

use crate::states::*;

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
      init, 
      seeds = [player.to_account_info().key.as_ref(), game.to_account_info().key.as_ref()],
      bump,
      payer = player,
      space = 8 + std::mem::size_of::<PlayProof>()
    )]
    pub play_proof: Account<'info, PlayProof>,
    #[account(
        mut,
    )]
    pub game: Account<'info, Game>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}