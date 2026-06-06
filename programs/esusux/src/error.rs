use anchor_lang::prelude::*;

#[error_code]
pub enum EsusuXError {
    #[msg("This circle is already full")]
    CircleFull,
    #[msg("This circle has already started, no new members allowed")]
    CircleAlreadyStarted,
    #[msg("You are already a member of this circle")]
    AlreadyMember,
    #[msg("Math overflow error")]
    MathOverflow,
    #[msg("Circle is not active yet")]
    CircleNotActive,
    #[msg("You have already received your payout")]
    AlreadyReceived,
}
