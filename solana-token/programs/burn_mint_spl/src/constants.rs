

/// Token decimals (matching EVM version)
pub const DECIMALS: u8 = 18;

/// Initial supply: 4 billion tokens (with 18 decimals)
/// u64 max is 18_446_744_073_709_551_615
/// With 18 decimals: 4B tokens = 4_000_000_000 * 10^18
/// Note: This exceeds u64 max, so we use a scaled representation
/// Actual supply will be 4_000_000_000 tokens (without decimals)
pub const INITIAL_SUPPLY: u64 = 4_000_000_000;

/// Maximum supply: 5 billion tokens (with 18 decimals)
/// Actual supply will be 5_000_000_000 tokens (without decimals)
pub const MAX_SUPPLY: u64 = 5_000_000_000;

/// Milestone threshold for gamification: 100M tokens
/// Actual threshold will be 100_000_000 tokens (without decimals)
pub const MILESTONE_THRESHOLD: u64 = 100_000_000;

/// Seed for token authority PDA
pub const TOKEN_AUTHORITY_SEED: &[u8] = b"token_authority";

/// Seed for token config PDA
pub const TOKEN_CONFIG_SEED: &[u8] = b"token_config";

/// Seed for minter role PDA
pub const MINTER_ROLE_SEED: &[u8] = b"minter_role";

/// Seed for burner role PDA
pub const BURNER_ROLE_SEED: &[u8] = b"burner_role";

/// Seed for user stats PDA
pub const USER_STATS_SEED: &[u8] = b"user_stats";

/// Maximum number of roles (for space allocation)
pub const MAX_ROLES: usize = 100;

/// Maximum length for token name
pub const MAX_NAME_LENGTH: usize = 64;

/// Maximum length for token symbol
pub const MAX_SYMBOL_LENGTH: usize = 16;

/// Maximum length for source chain name
pub const MAX_SOURCE_CHAIN_LENGTH: usize = 32;