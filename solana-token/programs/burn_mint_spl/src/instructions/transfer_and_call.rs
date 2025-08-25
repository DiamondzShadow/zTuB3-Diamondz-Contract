use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::error::*;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(amount: u64, data: Vec<u8>)]
pub struct TransferAndCall<'info> {
    #[account(
        seeds = [TOKEN_CONFIG_SEED],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(
        mut,
        token::mint = token_config.mint,
        token::authority = sender,
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = token_config.mint,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is the program that will receive the callback
    #[account()]
    pub receiver_program: UncheckedAccount<'info>,

    #[account(mut)]
    pub sender: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<TransferAndCall>, amount: u64, data: Vec<u8>) -> Result<()> {
    require!(amount > 0, BurnMintError::InvalidAmount);

    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Check if sender has enough tokens
    require!(
        ctx.accounts.sender_token_account.amount >= amount,
        BurnMintError::InsufficientBalance
    );

    // Transfer the tokens
    let cpi_accounts = Transfer {
        from: ctx.accounts.sender_token_account.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.sender.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, amount)?;

    // Emit transfer and call event
    emit!(TransferAndCallEvent {
        sender: ctx.accounts.sender.key(),
        recipient: ctx.accounts.recipient_token_account.owner,
        amount,
        data: data.clone(),
        receiver_program: ctx.accounts.receiver_program.key(),
        timestamp: now,
    });

    // Note: In a real implementation, you would invoke the receiver program here
    // with a CPI call. For now, we just emit the event for tracking.
    // Example receiver program interface:
    // ```
    // let receiver_accounts = vec![
    //     AccountMeta::new(ctx.accounts.recipient_token_account.key(), false),
    //     AccountMeta::new_readonly(ctx.accounts.sender.key(), false),
    // ];
    // 
    // let instruction_data = OnTokenTransferData {
    //     sender: ctx.accounts.sender.key(),
    //     amount,
    //     data,
    // };
    // 
    // let instruction = Instruction {
    //     program_id: ctx.accounts.receiver_program.key(),
    //     accounts: receiver_accounts,
    //     data: instruction_data.try_to_vec()?,
    // };
    // 
    // invoke(&instruction, &[
    //     ctx.accounts.recipient_token_account.to_account_info(),
    //     ctx.accounts.sender.to_account_info(),
    // ])?;
    // ```

    Ok(())
}

#[event]
pub struct TransferAndCallEvent {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub data: Vec<u8>,
    pub receiver_program: Pubkey,
    pub timestamp: i64,
}