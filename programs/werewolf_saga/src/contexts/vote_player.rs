use anchor_lang::prelude::*;

use crate::states::*;
use crate::errors::WerewolfError;

#[derive(Accounts)]
pub struct VotePlayer<'info> {
    #[account(mut, constraint = voter.to_account_info().key != player.key @ WerewolfError::FriendlyFire)]
    pub voter: Signer<'info>,
    #[account(
      seeds = [voter.to_account_info().key.as_ref(), game.to_account_info().key.as_ref()],
      bump,
    )]
    pub voter_proof: Account<'info, PlayProof>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub player: AccountInfo<'info>,
    #[account(
      mut,
      seeds = [player.to_account_info().key.as_ref(), game.to_account_info().key.as_ref()],
      bump,
    )]
    pub player_proof: Account<'info, PlayProof>,
    #[account(
      init, 
      seeds = [VOTE_PROOF_SEED, voter.to_account_info().key.as_ref(), u64::from(game.round).to_le_bytes().as_ref()],
      bump,
      payer = voter,
      space = 8 + std::mem::size_of::<VoteProof>()
    )]
    pub vote_proof: Account<'info, VoteProof>,
    #[account(mut)]
    pub game: Account<'info, Game>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}