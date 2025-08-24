use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(minter: Pubkey)]
pub struct RevokeMintRole<'info> {
    #[account(
        seeds = [TOKEN_CONFIG_SEED],
        bump = token_config.bump,
        has_one = owner @ BurnMintError::UnauthorizedOwner
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(
        mut,
        close = owner,
        seeds = [MINTER_ROLE_SEED, token_config.key().as_ref(), minter.as_ref()],
        bump = minter_role.bump
    )]
    pub minter_role: Account<'info, MinterRole>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

pub fn handler(ctx: Context<RevokeMintRole>, minter: Pubkey) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Emit role revoked event before closing account
    emit!(MinterRoleRevoked {
        minter,
        revoked_by: ctx.accounts.owner.key(),
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct MinterRoleRevoked {
    pub minter: Pubkey,
    pub revoked_by: Pubkey,
    pub timestamp: i64,
}