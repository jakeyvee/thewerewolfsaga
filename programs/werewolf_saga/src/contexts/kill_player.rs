use anchor_lang::prelude::*;

use crate::states::*;
use crate::errors::WerewolfError;

#[derive(Accounts)]
pub struct KillPlayer<'info> {
    #[account(mut, constraint = wolf.to_account_info().key != villager.key @ WerewolfError::FriendlyFire)]
    pub wolf: Signer<'info>,
    #[account(
      seeds = [wolf.to_account_info().key.as_ref(), game.to_account_info().key.as_ref()],
      bump,
    )]
    pub wolf_proof: Account<'info, PlayProof>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub villager: AccountInfo<'info>,
    #[account(
      mut,
      seeds = [villager.to_account_info().key.as_ref(), game.to_account_info().key.as_ref()],
      bump,
    )]
    pub villager_proof: Account<'info, PlayProof>,
    #[account(
      init, 
      seeds = [KILL_PROOF_SEED, u64::from(game.round).to_le_bytes().as_ref()],
      bump,
      payer = wolf,
      space = 8 + std::mem::size_of::<KillProof>()
    )]
    pub kill_proof: Account<'info, KillProof>,
    #[account(mut)]
    pub game: Account<'info, Game>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}