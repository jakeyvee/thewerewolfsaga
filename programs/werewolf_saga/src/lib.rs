use anchor_lang::prelude::*;

declare_id!("J3HhUaKjMaC71xyJLGmu31BR5KdE1osVyFmKCngBqAzH");

pub mod contexts;
pub mod errors;
pub mod instructions;
pub mod states;

use contexts::*;

#[program]
pub mod werewolf_saga {
    use super::*;

    pub fn create_game(ctx: Context<CreateGame>, _game_name: String) -> Result<()> {
        instructions::create_game::handler(ctx)
    }

    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        instructions::join_game::handler(ctx)
    }

    pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
        instructions::start_game::handler(ctx)
    }

    pub fn fill_play_proof(ctx: Context<FillPlayProof>) -> Result<()> {
        instructions::fill_play_proof::handler(ctx)
    }

    pub fn kill_player(ctx: Context<KillPlayer>) -> Result<()> {
        instructions::kill_player::handler(ctx)
    }

    pub fn see_player(ctx: Context<SeePlayer>) -> Result<()> {
        instructions::see_player::handler(ctx)
    }

    pub fn vote_player(ctx: Context<VotePlayer>) -> Result<()> {
        instructions::vote_player::handler(ctx)
    }

    pub fn eliminate_player(ctx: Context<EliminatePlayer>) -> Result<()> {
        instructions::eliminate_player::handler(ctx)
    }
}
