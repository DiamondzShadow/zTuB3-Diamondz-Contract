pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("4TbBXBy7HZbJpHv47B6EGrN4QnHv5wxcQ4Gtm1Siw898");

#[program]
pub mod burn_mint_spl {
    use super::*;

    /// Initialize the token mint with authority and configuration
    pub fn initialize(
        ctx: Context<Initialize>,
        decimals: u8,
        initial_supply: u64,
        max_supply: u64,
        name: String,
        symbol: String,
    ) -> Result<()> {
        initialize::handler(ctx, decimals, initial_supply, max_supply, name, symbol)
    }

    /// Mint tokens to a recipient address
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        mint_tokens::handler(ctx, amount)
    }

    /// Mint tokens with CCIP cross-chain metadata
    pub fn mint_tokens_with_ccip(
        ctx: Context<MintTokens>,
        amount: u64,
        source_chain: String,
        ccip_message_id: [u8; 32],
    ) -> Result<()> {
        mint_tokens_with_ccip::handler(ctx, amount, source_chain, ccip_message_id)
    }

    /// Burn tokens from the owner's account
    pub fn burn_tokens(
        ctx: Context<BurnTokens>,
        amount: u64,
    ) -> Result<()> {
        burn_tokens::handler(ctx, amount)
    }

    /// Grant minting authority to an address
    pub fn grant_mint_role(
        ctx: Context<GrantMintRole>,
        minter: Pubkey,
    ) -> Result<()> {
        grant_mint_role::handler(ctx, minter)
    }

    /// Revoke minting authority from an address
    pub fn revoke_mint_role(
        ctx: Context<RevokeMintRole>,
        minter: Pubkey,
    ) -> Result<()> {
        revoke_mint_role::handler(ctx, minter)
    }

    /// Grant burning authority to an address
    pub fn grant_burn_role(
        ctx: Context<GrantBurnRole>,
        burner: Pubkey,
    ) -> Result<()> {
        grant_burn_role::handler(ctx, burner)
    }

    /// Revoke burning authority from an address
    pub fn revoke_burn_role(
        ctx: Context<RevokeBurnRole>,
        burner: Pubkey,
    ) -> Result<()> {
        revoke_burn_role::handler(ctx, burner)
    }

    /// Update the maximum supply (owner only)
    pub fn set_max_supply(
        ctx: Context<SetMaxSupply>,
        new_max_supply: u64,
    ) -> Result<()> {
        set_max_supply::handler(ctx, new_max_supply)
    }

    /// Transfer tokens with additional data (similar to ERC677 transferAndCall)
    pub fn transfer_and_call(
        ctx: Context<TransferAndCall>,
        amount: u64,
        data: Vec<u8>,
    ) -> Result<()> {
        transfer_and_call::handler(ctx, amount, data)
    }
}