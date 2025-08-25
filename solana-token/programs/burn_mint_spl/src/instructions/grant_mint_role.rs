use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(minter: Pubkey)]
pub struct GrantMintRole<'info> {
    #[account(
        seeds = [TOKEN_CONFIG_SEED],
        bump = token_config.bump,
        has_one = owner @ BurnMintError::UnauthorizedOwner
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(
        init,
        payer = owner,
        space = MinterRole::LEN,
        seeds = [MINTER_ROLE_SEED, token_config.key().as_ref(), minter.as_ref()],
        bump
    )]
    pub minter_role: Account<'info, MinterRole>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<GrantMintRole>, minter: Pubkey) -> Result<()> {
    require!(minter != Pubkey::default(), BurnMintError::InvalidMinter);

    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Initialize minter role
    let minter_role = &mut ctx.accounts.minter_role;
    minter_role.token_config = ctx.accounts.token_config.key();
    minter_role.minter = minter;
    minter_role.granted_at = now;
    minter_role.granted_by = ctx.accounts.owner.key();
    minter_role.mint_count = 0;
    minter_role.total_minted = 0;
    minter_role.bump = ctx.bumps.minter_role;

    // Emit role granted event
    emit!(MinterRoleGranted {
        minter,
        granted_by: ctx.accounts.owner.key(),
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct MinterRoleGranted {
    pub minter: Pubkey,
    pub granted_by: Pubkey,
    pub timestamp: i64,
}