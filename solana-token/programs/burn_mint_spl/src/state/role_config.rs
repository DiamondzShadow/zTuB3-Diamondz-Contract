use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct MinterRole {
    /// The token config this role belongs to
    pub token_config: Pubkey,
    
    /// The address that has minting permission
    pub minter: Pubkey,
    
    /// When this role was granted
    pub granted_at: i64,
    
    /// Who granted this role
    pub granted_by: Pubkey,
    
    /// Number of times this minter has minted tokens
    pub mint_count: u64,
    
    /// Total amount minted by this minter
    pub total_minted: u64,
    
    /// Bump for PDA derivation
    pub bump: u8,
}

impl MinterRole {
    pub const LEN: usize = 8 + // discriminator
        32 + // token_config
        32 + // minter
        8 + // granted_at
        32 + // granted_by
        8 + // mint_count
        8 + // total_minted
        1; // bump
}

#[account]
pub struct BurnerRole {
    /// The token config this role belongs to
    pub token_config: Pubkey,
    
    /// The address that has burning permission
    pub burner: Pubkey,
    
    /// When this role was granted
    pub granted_at: i64,
    
    /// Who granted this role
    pub granted_by: Pubkey,
    
    /// Number of times this burner has burned tokens
    pub burn_count: u64,
    
    /// Total amount burned by this burner
    pub total_burned: u64,
    
    /// Bump for PDA derivation
    pub bump: u8,
}

impl BurnerRole {
    pub const LEN: usize = 8 + // discriminator
        32 + // token_config
        32 + // burner
        8 + // granted_at
        32 + // granted_by
        8 + // burn_count
        8 + // total_burned
        1; // bump
}