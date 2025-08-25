use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use crate::state::*;
use crate::error::*;
use crate::constants::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = owner,
        space = TokenConfig::LEN,
        seeds = [TOKEN_CONFIG_SEED],
        bump
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(
        init,
        payer = owner,
        mint::decimals = DECIMALS,
        mint::authority = token_authority,
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: This is a PDA used as mint authority
    #[account(
        seeds = [TOKEN_AUTHORITY_SEED],
        bump
    )]
    pub token_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = owner,
        token::mint = mint,
        token::authority = owner,
    )]
    pub initial_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = owner,
        space = UserStats::LEN,
        seeds = [USER_STATS_SEED, owner.key().as_ref()],
        bump
    )]
    pub owner_stats: Account<'info, UserStats>,

    #[account(
        init,
        payer = owner,
        space = MinterRole::LEN,
        seeds = [MINTER_ROLE_SEED, token_config.key().as_ref(), owner.key().as_ref()],
        bump
    )]
    pub owner_minter_role: Account<'info, MinterRole>,

    #[account(
        init,
        payer = owner,
        space = BurnerRole::LEN,
        seeds = [BURNER_ROLE_SEED, token_config.key().as_ref(), owner.key().as_ref()],
        bump
    )]
    pub owner_burner_role: Account<'info, BurnerRole>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<Initialize>,
    decimals: u8,
    initial_supply: u64,
    max_supply: u64,
    name: String,
    symbol: String,
) -> Result<()> {
    // Validate inputs
    require!(decimals == DECIMALS, BurnMintError::InvalidAmount);
    require!(initial_supply <= max_supply, BurnMintError::MaxSupplyExceeded);
    require!(name.len() <= MAX_NAME_LENGTH, BurnMintError::NameTooLong);
    require!(symbol.len() <= MAX_SYMBOL_LENGTH, BurnMintError::SymbolTooLong);

    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Get the token config key before mutable borrow
    let token_config_key = ctx.accounts.token_config.key();

    // Initialize token config
    let token_config = &mut ctx.accounts.token_config;
    token_config.owner = ctx.accounts.owner.key();
    token_config.mint = ctx.accounts.mint.key();
    token_config.name = name;
    token_config.symbol = symbol;
    token_config.decimals = decimals;
    token_config.max_supply = max_supply;
    token_config.total_mint_events = 1; // Initial mint counts as first event
    token_config.initialized_at = now;
    token_config.bump = ctx.bumps.token_config;

    // Initialize owner stats
    let owner_stats = &mut ctx.accounts.owner_stats;
    owner_stats.user = ctx.accounts.owner.key();
    owner_stats.total_minted = initial_supply;
    owner_stats.mint_count = 1;
    owner_stats.last_milestone = initial_supply / MILESTONE_THRESHOLD;
    owner_stats.milestones_achieved = if initial_supply >= MILESTONE_THRESHOLD { 
        initial_supply / MILESTONE_THRESHOLD 
    } else { 
        0 
    };
    owner_stats.created_at = now;
    owner_stats.last_mint_at = now;
    owner_stats.bump = ctx.bumps.owner_stats;

    // Initialize owner minter role
    let owner_minter_role = &mut ctx.accounts.owner_minter_role;
    owner_minter_role.token_config = token_config_key;
    owner_minter_role.minter = ctx.accounts.owner.key();
    owner_minter_role.granted_at = now;
    owner_minter_role.granted_by = ctx.accounts.owner.key();
    owner_minter_role.mint_count = 1;
    owner_minter_role.total_minted = initial_supply;
    owner_minter_role.bump = ctx.bumps.owner_minter_role;

    // Initialize owner burner role
    let owner_burner_role = &mut ctx.accounts.owner_burner_role;
    owner_burner_role.token_config = token_config_key;
    owner_burner_role.burner = ctx.accounts.owner.key();
    owner_burner_role.granted_at = now;
    owner_burner_role.granted_by = ctx.accounts.owner.key();
    owner_burner_role.burn_count = 0;
    owner_burner_role.total_burned = 0;
    owner_burner_role.bump = ctx.bumps.owner_burner_role;

    // Mint initial supply
    if initial_supply > 0 {
        let token_authority_bump = ctx.bumps.token_authority;
        let signer_seeds = &[TOKEN_AUTHORITY_SEED, &[token_authority_bump]];
        let signer = &[&signer_seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.initial_token_account.to_account_info(),
            authority: ctx.accounts.token_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::mint_to(cpi_ctx, initial_supply)?;
    }

    // Emit initialization event
    emit!(TokenInitialized {
        mint: ctx.accounts.mint.key(),
        owner: ctx.accounts.owner.key(),
        initial_supply,
        max_supply,
        name: token_config.name.clone(),
        symbol: token_config.symbol.clone(),
        timestamp: now,
    });

    // Emit initial mint event
    emit!(TokensMinted {
        minter: ctx.accounts.owner.key(),
        recipient: ctx.accounts.owner.key(),
        amount: initial_supply,
        total_supply: initial_supply,
        timestamp: now,
    });

    // Check for milestones
    if owner_stats.milestones_achieved > 0 {
        emit!(MintMilestone {
            recipient: ctx.accounts.owner.key(),
            total_minted: initial_supply,
            milestone_reached: owner_stats.milestones_achieved * MILESTONE_THRESHOLD,
        });
    }

    Ok(())
}

#[event]
pub struct TokenInitialized {
    pub mint: Pubkey,
    pub owner: Pubkey,
    pub initial_supply: u64,
    pub max_supply: u64,
    pub name: String,
    pub symbol: String,
    pub timestamp: i64,
}

#[event]
pub struct TokensMinted {
    pub minter: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub total_supply: u64,
    pub timestamp: i64,
}

#[event]
pub struct MintMilestone {
    pub recipient: Pubkey,
    pub total_minted: u64,
    pub milestone_reached: u64,
}