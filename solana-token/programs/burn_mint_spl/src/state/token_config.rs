use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct TokenConfig {
    /// The owner of the token (can manage roles and settings)
    pub owner: Pubkey,
    
    /// The mint address of the SPL token
    pub mint: Pubkey,
    
    /// Token name
    pub name: String,
    
    /// Token symbol
    pub symbol: String,
    
    /// Number of decimals
    pub decimals: u8,
    
    /// Maximum supply allowed
    pub max_supply: u64,
    
    /// Total number of mint events (for analytics)
    pub total_mint_events: u64,
    
    /// When the token was initialized
    pub initialized_at: i64,
    
    /// Bump for PDA derivation
    pub bump: u8,
}

impl TokenConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // owner
        32 + // mint
        4 + MAX_NAME_LENGTH + // name (String)
        4 + MAX_SYMBOL_LENGTH + // symbol (String)
        1 + // decimals
        8 + // max_supply
        8 + // total_mint_events
        8 + // initialized_at
        1; // bump
}