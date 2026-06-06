pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
pub use instructions::*;
pub use state::*;

declare_id!("CG2XsN5oeS1QzEUn3cuaqJb67uaAXgxMpPYsD9Qv5wJp");

#[program]
pub mod esusux {
    use super::*;

    pub fn create_circle(
        ctx: Context<CreateCircle>,
        contribution_amount: u64,
        max_members: u8,
        interval_days: u8,
    ) -> Result<()> {
        create_circle::handler(ctx, contribution_amount, max_members, interval_days)
    }

    pub fn join_circle(ctx: Context<JoinCircle>) -> Result<()> {
        join_circle::handler(ctx)
    }

    pub fn contribute_and_disburse(ctx: Context<ContributeAndDisburse>) -> Result<()> {
        contribute_and_disburse::handler(ctx)
    }
}
