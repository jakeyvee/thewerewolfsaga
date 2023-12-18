use anchor_lang::prelude::*;

use crate::states::*;
use crate::errors::WerewolfError;

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(mut)]
    pub organiser: Signer<'info>,
    #[account(
        mut,
        has_one = organiser @ WerewolfError::WrongPermission,
    )]
    pub game: Account<'info, Game>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}