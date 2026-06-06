use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::EsusuXError;

pub fn handler(ctx: Context<ContributeAndDisburse>) -> Result<()> {
    let circle = &mut ctx.accounts.circle;

    // Guard: circle must be active
    require!(circle.is_active, EsusuXError::CircleNotActive);

    // Guard: recipient must not have already received
    let round = circle.current_round as usize;
    let member_list = &ctx.accounts.member_list;
    require!(
        !member_list.has_received[round],
        EsusuXError::AlreadyReceived
    );

    // Step 1: Transfer contribution from member → circle vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.member_usdc_account.to_account_info(),
                to: ctx.accounts.circle_vault.to_account_info(),
                authority: ctx.accounts.member.to_account_info(),
            },
        ),
        circle.contribution_amount,
    )?;

    // Step 2: Check if all members have contributed this round
    // For MVP we disburse immediately after each contribution
    // In production this would track per-member contributions
    let total_pool = circle.contribution_amount
        .checked_mul(circle.max_members as u64)
        .ok_or(EsusuXError::MathOverflow)?;

    // Step 3: Disburse full pool to this round's recipient
    let recipient_key = member_list.members[round];
    require!(
        ctx.accounts.recipient_usdc_account.owner == recipient_key,
        EsusuXError::CircleNotActive
    );

    // Build PDA signer seeds for the vault
    let circle_key = circle.key();
    let seeds = &[
        b"vault",
        circle_key.as_ref(),
        &[ctx.bumps.circle_vault],
    ];
    let signer_seeds = &[&seeds[..]];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.circle_vault.to_account_info(),
                to: ctx.accounts.recipient_usdc_account.to_account_info(),
                authority: ctx.accounts.circle_vault.to_account_info(),
            },
            signer_seeds,
        ),
        total_pool,
    )?;

    // Step 4: Mark recipient as paid and advance round
    let member_list = &mut ctx.accounts.member_list;
    member_list.has_received[round] = true;
    circle.current_round += 1;

    // Step 5: Check if all rounds complete
    if circle.current_round >= circle.max_members {
        circle.is_active = false;
        msg!("Circle complete! All members have received their payout.");
    }

    msg!(
        "Round {} complete. {} USDC disbursed to {}",
        round,
        total_pool,
        recipient_key
    );

    Ok(())
}

#[derive(Accounts)]
pub struct ContributeAndDisburse<'info> {
    #[account(mut)]
    pub circle: Account<'info, Circle>,

    #[account(
        mut,
        seeds = [b"members", circle.key().as_ref()],
        bump
    )]
    pub member_list: Account<'info, MemberList>,

    // Member making the contribution
    #[account(mut)]
    pub member: Signer<'info>,

    // Member's USDC account (contribution comes from here)
    #[account(mut)]
    pub member_usdc_account: Account<'info, TokenAccount>,

    // Circle vault (holds contributions, seeds controlled by program)
    #[account(
        mut,
        seeds = [b"vault", circle.key().as_ref()],
        bump
    )]
    pub circle_vault: Account<'info, TokenAccount>,

    // This round's recipient USDC account
    #[account(mut)]
    pub recipient_usdc_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
