use anchor_lang::prelude::*;

#[account]
pub struct Circle {
    pub organizer: Pubkey,
    pub contribution_amount: u64,
    pub max_members: u8,
    pub interval_days: u8,
    pub member_count: u8,
    pub current_round: u8,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
pub struct MemberList {
    pub circle: Pubkey,
    pub members: Vec<Pubkey>,
    pub collateral_amounts: Vec<u64>,
    pub has_received: Vec<bool>,
}

impl Circle {
    pub const LEN: usize = 8 + 32 + 8 + 1 + 1 + 1 + 1 + 1 + 1;
}

impl MemberList {
    pub const LEN: usize = 8 + 32 + (4 + 32 * 10) + (4 + 8 * 10) + (4 + 1 * 10);
}
