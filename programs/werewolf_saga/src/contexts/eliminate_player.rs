use anchor_lang::prelude::*;

use crate::states::*;

#[derive(Accounts)]
pub struct EliminatePlayer<'info> {
    #[account(mut)]
    pub initiator: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub player: AccountInfo<'info>,
    #[account(
      mut,
      seeds = [player.to_account_info().key.as_ref(), game.to_account_info().key.as_ref()],
      bump,
    )]
    pub player_proof: Account<'info, PlayProof>,
    #[account(mut)]
    pub game: Account<'info, Game>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}