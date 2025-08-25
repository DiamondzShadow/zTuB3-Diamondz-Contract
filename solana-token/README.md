# BurnMintSPL Token - Solana Implementation

A comprehensive SPL token implementation that mirrors the functionality of your EVM BurnMintERC677 token, designed for seamless cross-chain integration via Chainlink CCIP.

## 🌟 Features

### Core Token Features
- **SPL Token Standard**: Native Solana token implementation
- **18 Decimals**: Matching your EVM token for consistency
- **4 Billion Initial Supply**: Same as your EVM deployment
- **5 Billion Max Supply**: With runtime enforcement
- **Role-Based Access Control**: Granular mint and burn permissions

### Cross-Chain Integration
- **CCIP Compatible**: Designed for Chainlink Cross-Chain Token workflows
- **Cross-Chain Metadata**: Track source chain and CCIP message IDs
- **Mint/Burn Authority**: Delegate permissions to CCIP routers
- **Event Logging**: Comprehensive events for cross-chain analytics

### Gamification & Analytics
- **Milestone Tracking**: Automatic detection of 100M token milestones
- **User Statistics**: Per-address mint/burn tracking
- **Role Statistics**: Monitor minter and burner activity
- **Structured Logging**: Program logs for analytics platforms

### Advanced Features
- **Transfer and Call**: Solana equivalent to ERC677's transferAndCall
- **Dynamic Max Supply**: Owner can adjust maximum supply
- **Role Management**: Grant/revoke permissions with full audit trail
- **Program Derived Addresses**: Secure, deterministic account management

## 🏗️ Architecture

### Program Structure
```
burn_mint_spl/
├── programs/burn_mint_spl/src/
│   ├── lib.rs                 # Main program entry point
│   ├── constants.rs           # Program constants and seeds
│   ├── error.rs              # Custom error definitions
│   ├── state/                # Account state structures
│   │   ├── token_config.rs   # Main token configuration
│   │   ├── user_stats.rs     # Per-user statistics
│   │   └── role_config.rs    # Minter/burner role management
│   └── instructions/         # Program instructions
│       ├── initialize.rs     # Token initialization
│       ├── mint_tokens.rs    # Standard minting
│       ├── mint_tokens_with_ccip.rs  # CCIP-aware minting
│       ├── burn_tokens.rs    # Token burning
│       ├── grant_mint_role.rs # Role management
│       └── ...               # Other instructions
├── scripts/
│   ├── deploy.js            # Deployment automation
│   └── interact.js          # Client interaction examples
├── tests/
│   └── burn_mint_spl.ts     # Comprehensive test suite
└── DEPLOYMENT_GUIDE.md      # Detailed deployment instructions
```

### Account Structure
- **TokenConfig**: Main configuration and metadata
- **UserStats**: Per-user minting statistics and milestones
- **MinterRole**: Minting permission tracking
- **BurnerRole**: Burning permission tracking

## 🚀 Quick Start

### Prerequisites
- Rust 1.79.0+
- Solana CLI 1.18.26+
- Anchor Framework 0.31.1+
- Node.js 16+

### Installation
```bash
# Clone and setup
cd burn_mint_spl
yarn install

# Build the program
anchor build
```

### Deploy to Devnet
```bash
# Configure for devnet
export SOLANA_NETWORK=devnet
export ANCHOR_WALLET=~/.config/solana/id.json
solana config set --url https://api.devnet.solana.com

# Fund your wallet
solana airdrop 2

# Deploy
yarn deploy:devnet
```

### Verify Deployment
```bash
# Test interactions
yarn interact:devnet

# View deployment info
cat deployment-devnet.json
```

## 🔧 Usage Examples

### Basic Token Operations

```javascript
const { BurnMintSPLClient } = require('./scripts/interact');

// Initialize client
const client = new BurnMintSPLClient(connection, wallet, programId);

// Get token information
const config = await client.getTokenConfig();
console.log(`Token: ${config.name} (${config.symbol})`);
console.log(`Max Supply: ${config.maxSupply.toString()}`);

// Mint tokens
const mintTx = await client.mintTokens(
  recipientPubkey,
  '1000000000000000000000' // 1000 tokens with 18 decimals
);

// Burn tokens
const burnTx = await client.burnTokens('100000000000000000000'); // 100 tokens
```

### CCIP Cross-Chain Minting

```javascript
// Mint with cross-chain metadata
const ccipTx = await client.mintTokensWithCCIP(
  recipientPubkey,
  '500000000000000000000', // 500 tokens
  'arbitrum',               // source chain
  ccipMessageId            // CCIP message ID bytes
);
```

### Role Management

```javascript
// Grant minting permission to CCIP router
await client.grantMintRole(CCIP_ROUTER_PUBKEY);

// Grant burning permission
await client.grantBurnRole(CCIP_ROUTER_PUBKEY);

// Revoke permissions
await client.revokeMintRole(OLD_MINTER_PUBKEY);
```

## 🌉 CCIP Integration

### Setup for Cross-Chain Transfers

1. **Deploy Token**: Follow deployment guide
2. **Configure Roles**: Grant CCIP router mint/burn permissions
3. **Register with CCIP**: Add token to CCIP token pools
4. **Test Transfers**: Verify cross-chain functionality

### CCIP Router Integration

```javascript
// Grant permissions to CCIP router
const ccipRouterPubkey = new PublicKey("CCIP_ROUTER_ADDRESS");
await client.grantMintRole(ccipRouterPubkey);
await client.grantBurnRole(ccipRouterPubkey);
```

### Cross-Chain Event Tracking

```javascript
// Events emitted for CCIP tracking
emit!(CrossChainMint {
  recipient,
  amount,
  source_chain: "arbitrum",
  ccip_message_id,
  minter,
  timestamp,
});
```

## 📊 Comparison with EVM Token

| Feature | EVM (BurnMintERC677) | Solana (BurnMintSPL) |
|---------|---------------------|---------------------|
| **Token Standard** | ERC677 (extends ERC20) | SPL Token |
| **Initial Supply** | 4,000,000,000 tokens | 4,000,000,000 tokens |
| **Max Supply** | 5,000,000,000 tokens | 5,000,000,000 tokens |
| **Decimals** | 18 | 18 |
| **Mint/Burn Roles** | ✅ EnumerableSet | ✅ PDA-based roles |
| **CCIP Integration** | ✅ Native support | ✅ Native support |
| **Milestone Tracking** | ✅ 100M thresholds | ✅ 100M thresholds |
| **Transfer & Call** | ✅ ERC677 standard | ✅ Custom instruction |
| **Owner Controls** | ✅ Ownable pattern | ✅ Authority checks |
| **Max Supply Updates** | ✅ Owner only | ✅ Owner only |
| **Event Logging** | ✅ Solidity events | ✅ Anchor events |

## 🧪 Testing

### Run Tests
```bash
# Run full test suite
anchor test

# Run specific tests
anchor test --skip-deploy
```

### Test Coverage
- ✅ Token initialization
- ✅ Minting with role validation
- ✅ CCIP metadata tracking
- ✅ Burning functionality
- ✅ Role management (grant/revoke)
- ✅ Max supply enforcement
- ✅ Milestone detection
- ✅ Error handling

## 🔒 Security Features

### Access Control
- **Role-Based Permissions**: Separate mint and burn authorities
- **Owner Controls**: Only owner can manage roles and settings
- **PDA Security**: All critical accounts use Program Derived Addresses

### Supply Protection
- **Max Supply Enforcement**: Cannot mint beyond configured limit
- **Overflow Protection**: Safe arithmetic operations throughout
- **Role Validation**: All operations verify proper permissions

### Audit Considerations
- **Immutable Deployment**: Consider using immutable programs for mainnet
- **Key Management**: Secure storage of all administrative keys
- **Role Monitoring**: Track all permission changes

## 📈 Monitoring & Analytics

### Key Metrics to Track
- Total supply changes
- Mint/burn transaction volume
- Cross-chain transfer volume
- Role permission changes
- Milestone achievements

### Event Monitoring
```javascript
// Subscribe to program logs
connection.onLogs(programId, (logInfo) => {
  // Process token events
  console.log('Program logs:', logInfo);
});
```

## 🚀 Mainnet Deployment

### Pre-Deployment Checklist
- [ ] Code audited and tested on devnet
- [ ] Sufficient SOL for deployment (~0.1 SOL)
- [ ] Backup of all keypairs
- [ ] CCIP integration tested
- [ ] Monitoring infrastructure ready

### Deployment Commands
```bash
# Set mainnet configuration
export SOLANA_NETWORK=mainnet
export RPC_URL=https://api.mainnet-beta.solana.com

# Deploy to mainnet
yarn deploy:mainnet
```

### Post-Deployment
1. Verify on Solana Explorer
2. Grant CCIP router permissions
3. Test cross-chain transfers
4. Set up monitoring alerts
5. Document all addresses

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Resources

- [Anchor Documentation](https://anchor-lang.com)
- [Solana Documentation](https://docs.solana.com)
- [SPL Token Documentation](https://spl.solana.com/token)
- [Chainlink CCIP Documentation](https://docs.chain.link/ccip)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [x] Core token functionality
- [x] CCIP integration support
- [x] Gamification features
- [x] Comprehensive testing
- [x] Deployment automation
- [ ] Mainnet deployment
- [ ] CCIP router integration
- [ ] Cross-chain testing
- [ ] Production monitoring

---

**Ready to bridge your token to Solana!** 🌉

Your BurnMintSPL token provides feature-complete parity with your EVM implementation, enabling seamless cross-chain transfers via Chainlink CCIP while maintaining all the gamification and analytics features of the original token.