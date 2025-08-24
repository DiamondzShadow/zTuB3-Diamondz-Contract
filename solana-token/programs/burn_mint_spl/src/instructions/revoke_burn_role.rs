use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(burner: Pubkey)]
pub struct RevokeBurnRole<'info> {
    #[account(
        seeds = [TOKEN_CONFIG_SEED],
        bump = token_config.bump,
        has_one = owner @ BurnMintError::UnauthorizedOwner
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(
        mut,
        close = owner,
        seeds = [BURNER_ROLE_SEED, token_config.key().as_ref(), burner.as_ref()],
        bump = burner_role.bump
    )]
    pub burner_role: Account<'info, BurnerRole>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

pub fn handler(ctx: Context<RevokeBurnRole>, burner: Pubkey) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Emit role revoked event before closing account
    emit!(BurnerRoleRevoked {
        burner,
        revoked_by: ctx.accounts.owner.key(),
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct BurnerRoleRevoked {
    pub burner: Pubkey,
    pub revoked_by: Pubkey,
    pub timestamp: i64,
}