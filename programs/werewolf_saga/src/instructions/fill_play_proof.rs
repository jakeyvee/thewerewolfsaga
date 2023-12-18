use crate::{contexts::FillPlayProof, states::RoleType};
use anchor_lang::prelude::*;

pub fn handler(ctx: Context<FillPlayProof>) -> Result<()> {
    if ctx.accounts.play_proof.pos == ctx.accounts.game.wolf_pos {
        ctx.accounts.play_proof.set_role(RoleType::WOLF);
    } else if ctx.accounts.play_proof.pos == ctx.accounts.game.seer_pos {
        ctx.accounts.play_proof.set_role(RoleType::SEER);
    } else {
        ctx.accounts.play_proof.set_role(RoleType::VILLAGER);
    }

    Ok(())
}