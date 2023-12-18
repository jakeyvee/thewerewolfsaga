use anchor_lang::prelude::*;

use crate::states::*;
use crate::errors::WerewolfError;

#[derive(Accounts)]
pub struct SeePlayer<'info> {
    #[account(mut, constraint = seer.to_account_info().key != player.key @ WerewolfError::FriendlyFire)]
    pub seer: Signer<'info>,
    #[account(
      seeds = [seer.to_account_info().key.as_ref(), game.to_account_info().key.as_ref()],
      bump,
    )]
    pub seer_proof: Account<'info, PlayProof>,
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
      seeds = [SIGHT_PROOF_SEED, u64::from(game.round).to_le_bytes().as_ref()],
      bump,
      payer = seer,
      space = 8 + std::mem::size_of::<SightProof>()
    )]
    pub sight_proof: Account<'info, SightProof>,
    #[account()]
    pub game: Account<'info, Game>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,

}