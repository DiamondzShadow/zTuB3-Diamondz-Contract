use anchor_lang::prelude::*;

#[account]
pub struct UserStats {
    /// The user this stats account belongs to
    pub user: Pubkey,
    
    /// Total amount of tokens minted to this user
    pub total_minted: u64,
    
    /// Number of times tokens were minted to this user
    pub mint_count: u64,
    
    /// Last milestone reached (in units of MILESTONE_THRESHOLD)
    pub last_milestone: u64,
    
    /// Total milestones achieved
    pub milestones_achieved: u64,
    
    /// When this stats account was created
    pub created_at: i64,
    
    /// Last time tokens were minted to this user
    pub last_mint_at: i64,
    
    /// Bump for PDA derivation
    pub bump: u8,
}

impl UserStats {
    pub const LEN: usize = 8 + // discriminator
        32 + // user
        8 + // total_minted
        8 + // mint_count
        8 + // last_milestone
        8 + // milestones_achieved
        8 + // created_at
        8 + // last_mint_at
        1; // bump
}