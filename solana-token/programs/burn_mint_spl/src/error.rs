use anchor_lang::prelude::*;

#[error_code]
pub enum BurnMintError {
    #[msg("Invalid recipient address")]
    InvalidRecipient,
    
    #[msg("Invalid minter address")]
    InvalidMinter,
    
    #[msg("Invalid burner address")]
    InvalidBurner,
    
    #[msg("Maximum supply exceeded")]
    MaxSupplyExceeded,
    
    #[msg("Unauthorized: caller is not a minter")]
    UnauthorizedMinter,
    
    #[msg("Unauthorized: caller is not a burner")]
    UnauthorizedBurner,
    
    #[msg("Unauthorized: caller is not the owner")]
    UnauthorizedOwner,
    
    #[msg("Insufficient balance")]
    InsufficientBalance,
    
    #[msg("Invalid amount")]
    InvalidAmount,
    
    #[msg("Token name too long")]
    NameTooLong,
    
    #[msg("Token symbol too long")]
    SymbolTooLong,
    
    #[msg("Source chain name too long")]
    SourceChainTooLong,
    
    #[msg("Role already exists")]
    RoleAlreadyExists,
    
    #[msg("Role does not exist")]
    RoleDoesNotExist,
    
    #[msg("Max roles limit reached")]
    MaxRolesReached,
    
    #[msg("Invalid new max supply")]
    InvalidNewMaxSupply,
    
    #[msg("Account already initialized")]
    AccountAlreadyInitialized,
    
    #[msg("Account not initialized")]
    AccountNotInitialized,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Arithmetic underflow")]
    ArithmeticUnderflow,
}