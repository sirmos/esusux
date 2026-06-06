use anchor_lang::prelude::*;
use crate::state::Circle;
use crate::error::EsusuXError;

pub fn handler(
    ctx: Context<CreateCircle>,
    contribution_amount: u64,
    max_members: u8,
    interval_days: u8,
) -> Result<()> {
    let circle = &mut ctx.accounts.circle;

    require!(max_members >= 2, EsusuXError::CircleFull);
    require!(contribution_amount > 0, EsusuXError::MathOverflow);

    circle.organizer = ctx.accounts.organizer.key();
    circle.contribution_amount = contribution_amount;
    circle.max_members = max_members;
    circle.interval_days = interval_days;
    circle.member_count = 0;
    circle.current_round = 0;
    circle.is_active = false;
    circle.bump = ctx.bumps.circle;

    msg!("Circle created by {}", circle.organizer);
    Ok(())
}

#[derive(Accounts)]
pub struct CreateCircle<'info> {
    #[account(
        init,
        payer = organizer,
        space = Circle::LEN,
        seeds = [b"circle", organizer.key().as_ref()],
        bump
    )]
    pub circle: Account<'info, Circle>,

    #[account(mut)]
    pub organizer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
