use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::EsusuXError;

pub fn handler(ctx: Context<JoinCircle>) -> Result<()> {
    let circle = &mut ctx.accounts.circle;

    require!(circle.member_count < circle.max_members, EsusuXError::CircleFull);
    require!(!circle.is_active, EsusuXError::CircleAlreadyStarted);

    let member_key = ctx.accounts.member.key();
    require!(
        !ctx.accounts.member_list.members.contains(&member_key),
        EsusuXError::AlreadyMember
    );

    let total_commitment = circle.contribution_amount
        .checked_mul(circle.max_members as u64)
        .ok_or(EsusuXError::MathOverflow)?;
    let collateral_amount = total_commitment / 10;

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.member_usdc_account.to_account_info(),
                to: ctx.accounts.circle_vault.to_account_info(),
                authority: ctx.accounts.member.to_account_info(),
            },
        ),
        collateral_amount,
    )?;

    let member_list = &mut ctx.accounts.member_list;
    member_list.members.push(member_key);
    member_list.collateral_amounts.push(collateral_amount);
    member_list.has_received.push(false);
    circle.member_count += 1;

    if circle.member_count == circle.max_members {
        circle.is_active = true;
        msg!("Circle is now full and active!");
    }

    msg!("{} joined the circle", member_key);
    Ok(())
}

#[derive(Accounts)]
pub struct JoinCircle<'info> {
    #[account(mut)]
    pub circle: Account<'info, Circle>,

    #[account(
        init_if_needed,
        payer = member,
        space = MemberList::LEN,
        seeds = [b"members", circle.key().as_ref()],
        bump
    )]
    pub member_list: Account<'info, MemberList>,

    #[account(mut)]
    pub member: Signer<'info>,

    #[account(mut)]
    pub member_usdc_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub circle_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
