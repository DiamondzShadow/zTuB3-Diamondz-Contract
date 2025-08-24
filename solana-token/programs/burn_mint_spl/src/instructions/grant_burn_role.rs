use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(burner: Pubkey)]
pub struct GrantBurnRole<'info> {
    #[account(
        seeds = [TOKEN_CONFIG_SEED],
        bump = token_config.bump,
        has_one = owner @ BurnMintError::UnauthorizedOwner
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(
        init,
        payer = owner,
        space = BurnerRole::LEN,
        seeds = [BURNER_ROLE_SEED, token_config.key().as_ref(), burner.as_ref()],
        bump
    )]
    pub burner_role: Account<'info, BurnerRole>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<GrantBurnRole>, burner: Pubkey) -> Result<()> {
    require!(burner != Pubkey::default(), BurnMintError::InvalidBurner);

    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Initialize burner role
    let burner_role = &mut ctx.accounts.burner_role;
    burner_role.token_config = ctx.accounts.token_config.key();
    burner_role.burner = burner;
    burner_role.granted_at = now;
    burner_role.granted_by = ctx.accounts.owner.key();
    burner_role.burn_count = 0;
    burner_role.total_burned = 0;
    burner_role.bump = ctx.bumps.burner_role;

    // Emit role granted event
    emit!(BurnerRoleGranted {
        burner,
        granted_by: ctx.accounts.owner.key(),
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct BurnerRoleGranted {
    pub burner: Pubkey,
    pub granted_by: Pubkey,
    pub timestamp: i64,
}