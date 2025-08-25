use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct SetMaxSupply<'info> {
    #[account(
        mut,
        seeds = [TOKEN_CONFIG_SEED],
        bump = token_config.bump,
        has_one = owner @ BurnMintError::UnauthorizedOwner
    )]
    pub token_config: Account<'info, TokenConfig>,

    pub owner: Signer<'info>,
}

pub fn handler(ctx: Context<SetMaxSupply>, new_max_supply: u64) -> Result<()> {
    require!(new_max_supply > 0, BurnMintError::InvalidNewMaxSupply);

    let token_config = &mut ctx.accounts.token_config;
    let old_max_supply = token_config.max_supply;
    
    token_config.max_supply = new_max_supply;

    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Emit max supply updated event
    emit!(MaxSupplyUpdated {
        old_max_supply,
        new_max_supply,
        updated_by: ctx.accounts.owner.key(),
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct MaxSupplyUpdated {
    pub old_max_supply: u64,
    pub new_max_supply: u64,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}