use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use crate::state::*;
use crate::error::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(amount: u64, source_chain: String, ccip_message_id: [u8; 32])]
pub struct MintTokensWithCcip<'info> {
    #[account(
        mut,
        seeds = [TOKEN_CONFIG_SEED],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(
        mut,
        address = token_config.mint
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: This is a PDA used as mint authority
    #[account(
        seeds = [TOKEN_AUTHORITY_SEED],
        bump
    )]
    pub token_authority: UncheckedAccount<'info>,

    #[account(
        mut,
        token::mint = mint,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = minter,
        space = UserStats::LEN,
        seeds = [USER_STATS_SEED, recipient_token_account.owner.as_ref()],
        bump
    )]
    pub recipient_stats: Account<'info, UserStats>,

    #[account(
        seeds = [MINTER_ROLE_SEED, token_config.key().as_ref(), minter.key().as_ref()],
        bump = minter_role.bump
    )]
    pub minter_role: Account<'info, MinterRole>,

    #[account(mut)]
    pub minter: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<MintTokensWithCcip>,
    amount: u64,
    source_chain: String,
    ccip_message_id: [u8; 32],
) -> Result<()> {
    require!(amount > 0, BurnMintError::InvalidAmount);
    require!(
        source_chain.len() <= MAX_SOURCE_CHAIN_LENGTH,
        BurnMintError::SourceChainTooLong
    );

    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Check max supply
    let current_supply = ctx.accounts.mint.supply;
    let new_supply = current_supply
        .checked_add(amount)
        .ok_or(BurnMintError::ArithmeticOverflow)?;
    
    require!(
        new_supply <= ctx.accounts.token_config.max_supply,
        BurnMintError::MaxSupplyExceeded
    );

    // Mint the tokens
    let token_authority_bump = ctx.bumps.token_authority;
    let signer_seeds = &[TOKEN_AUTHORITY_SEED, &[token_authority_bump]];
    let signer = &[&signer_seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.token_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::mint_to(cpi_ctx, amount)?;

    // Update token config
    let token_config = &mut ctx.accounts.token_config;
    token_config.total_mint_events = token_config.total_mint_events
        .checked_add(1)
        .ok_or(BurnMintError::ArithmeticOverflow)?;

    // Update or initialize recipient stats
    let recipient_stats = &mut ctx.accounts.recipient_stats;
    let is_new_account = recipient_stats.user == Pubkey::default();
    
    if is_new_account {
        recipient_stats.user = ctx.accounts.recipient_token_account.owner;
        recipient_stats.total_minted = amount;
        recipient_stats.mint_count = 1;
        recipient_stats.created_at = now;
        recipient_stats.bump = ctx.bumps.recipient_stats;
    } else {
        recipient_stats.total_minted = recipient_stats.total_minted
            .checked_add(amount)
            .ok_or(BurnMintError::ArithmeticOverflow)?;
        recipient_stats.mint_count = recipient_stats.mint_count
            .checked_add(1)
            .ok_or(BurnMintError::ArithmeticOverflow)?;
    }
    
    recipient_stats.last_mint_at = now;

    // Check for milestones
    let new_milestone = recipient_stats.total_minted / MILESTONE_THRESHOLD;
    let previous_milestone = recipient_stats.last_milestone;
    
    if new_milestone > previous_milestone {
        recipient_stats.last_milestone = new_milestone;
        recipient_stats.milestones_achieved = recipient_stats.milestones_achieved
            .checked_add(new_milestone - previous_milestone)
            .ok_or(BurnMintError::ArithmeticOverflow)?;

        emit!(MintMilestone {
            recipient: recipient_stats.user,
            total_minted: recipient_stats.total_minted,
            milestone_reached: new_milestone * MILESTONE_THRESHOLD,
        });
    }

    // Update minter role stats
    let minter_role = &mut ctx.accounts.minter_role;
    minter_role.mint_count = minter_role.mint_count
        .checked_add(1)
        .ok_or(BurnMintError::ArithmeticOverflow)?;
    minter_role.total_minted = minter_role.total_minted
        .checked_add(amount)
        .ok_or(BurnMintError::ArithmeticOverflow)?;

    // Emit cross-chain mint event
    emit!(CrossChainMint {
        recipient: recipient_stats.user,
        amount,
        source_chain,
        ccip_message_id,
        minter: ctx.accounts.minter.key(),
        timestamp: now,
    });

    // Emit regular mint event
    emit!(TokensMinted {
        minter: ctx.accounts.minter.key(),
        recipient: recipient_stats.user,
        amount,
        total_supply: new_supply,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct CrossChainMint {
    pub recipient: Pubkey,
    pub amount: u64,
    pub source_chain: String,
    pub ccip_message_id: [u8; 32],
    pub minter: Pubkey,
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