use anchor_lang::prelude::*;

use crate::states::{PlayProof, Game};
use crate::errors::WerewolfError;

#[derive(Accounts)]
pub struct FillPlayProof<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
      mut,
      has_one = player @ WerewolfError::WrongPermission,
      seeds = [player.to_account_info().key.as_ref(), game.to_account_info().key.as_ref()],
      bump,
    )]
    pub play_proof: Account<'info, PlayProof>,
    #[account()]
    pub game: Account<'info, Game>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}