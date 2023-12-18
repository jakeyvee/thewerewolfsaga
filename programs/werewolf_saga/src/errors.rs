use anchor_lang::prelude::*;

#[error_code]
pub enum WerewolfError {
    #[msg("invalid status passed")]
    InvalidStatus,
    #[msg("invalid period passed")]
    InvalidPeriod,
    #[msg("invalid role passed")]
    InvalidRole,
    #[msg("wrong role type")]
    WrongRole,
    #[msg("wrong period type")]
    WrongPeriod,
    #[msg("wrong permission type")]
    WrongPermission,
    #[msg("wrong player proof")]
    WrongPlayerProof,
    #[msg("game has already started")]
    GameStarted,
    #[msg("game is not in play")]
    GameInactive,
    #[msg("can't damage friendly")]
    FriendlyFire,
    #[msg("player already dead")]
    AlreadyDead,
    #[msg("someone alive has not voted")]
    MissingVotes,
    #[msg("generic error...")]
    GenericError,
}
