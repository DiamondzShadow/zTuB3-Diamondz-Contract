use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Burn};
use crate::state::*;
use crate::error::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct BurnTokens<'info> {
    #[account(
        seeds = [TOKEN_CONFIG_SEED],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(
        mut,
        address = token_config.mint
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = burner,
    )]
    pub burner_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [BURNER_ROLE_SEED, token_config.key().as_ref(), burner.key().as_ref()],
        bump = burner_role.bump
    )]
    pub burner_role: Account<'info, BurnerRole>,

    #[account(mut)]
    pub burner: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
    require!(amount > 0, BurnMintError::InvalidAmount);

    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Check if burner has enough tokens
    require!(
        ctx.accounts.burner_token_account.amount >= amount,
        BurnMintError::InsufficientBalance
    );

    // Burn the tokens
    let cpi_accounts = Burn {
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.burner_token_account.to_account_info(),
        authority: ctx.accounts.burner.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::burn(cpi_ctx, amount)?;

    // Update burner role stats
    let burner_role = &mut ctx.accounts.burner_role;
    burner_role.burn_count = burner_role.burn_count
        .checked_add(1)
        .ok_or(BurnMintError::ArithmeticOverflow)?;
    burner_role.total_burned = burner_role.total_burned
        .checked_add(amount)
        .ok_or(BurnMintError::ArithmeticOverflow)?;

    // Emit burn event
    emit!(TokensBurned {
        burner: ctx.accounts.burner.key(),
        amount,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct TokensBurned {
    pub burner: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}