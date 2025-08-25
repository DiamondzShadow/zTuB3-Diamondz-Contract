# BurnMintSPL Token - Deployment Guide

This guide provides step-by-step instructions for deploying the BurnMintSPL token on Solana that mirrors the functionality of your EVM token for CCIP cross-chain integration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Building the Program](#building-the-program)
- [Deployment](#deployment)
- [Verification](#verification)
- [Usage Examples](#usage-examples)
- [CCIP Integration](#ccip-integration)
- [Mainnet Deployment](#mainnet-deployment)

## Prerequisites

### Required Software

1. **Rust** (version 1.79.0 or newer)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup update stable
rustup default stable
```

2. **Solana CLI** (version 1.18.26 or compatible)
```bash
# Download and install
wget -O - https://github.com/solana-labs/solana/releases/download/v1.18.26/solana-release-x86_64-unknown-linux-gnu.tar.bz2 | tar -xj
export PATH=$PATH:$PWD/solana-release/bin

# Or use the official installer
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

3. **Anchor Framework** (version 0.31.1)
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest
```

4. **Node.js and Yarn**
```bash
# Install Node.js (16+ required)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
npm install -g yarn
```

### Wallet Setup

1. **Create a Solana wallet** (if you don't have one):
```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

2. **Fund your wallet:**
```bash
# For devnet testing
solana airdrop 2 --url https://api.devnet.solana.com

# For mainnet, transfer SOL from an exchange or another wallet
```

## Environment Setup

1. **Clone and setup the project:**
```bash
cd burn_mint_spl
yarn install
```

2. **Configure Anchor:**
```bash
# Set your wallet path
export ANCHOR_WALLET=~/.config/solana/id.json

# Configure Solana CLI for desired network
solana config set --url https://api.devnet.solana.com  # For devnet
# solana config set --url https://api.mainnet-beta.solana.com  # For mainnet
```

3. **Set environment variables:**
```bash
export SOLANA_NETWORK=devnet  # or mainnet
export RPC_URL=https://api.devnet.solana.com  # or your custom RPC
```

## Building the Program

1. **Build the Anchor program:**
```bash
anchor build
```

2. **Verify the build:**
```bash
ls -la target/deploy/
ls -la target/idl/
```

You should see:
- `target/deploy/burn_mint_spl.so` (the compiled program)
- `target/idl/burn_mint_spl.json` (the IDL file)

## Deployment

### Deploy to Devnet (Recommended for Testing)

1. **Configure for devnet:**
```bash
anchor config set --provider.cluster devnet
solana config set --url https://api.devnet.solana.com
```

2. **Deploy the program:**
```bash
anchor deploy
```

3. **Initialize the token:**
```bash
node scripts/deploy.js
```

This will:
- Deploy the program to Solana
- Initialize the token with 4 billion initial supply (4,000,000,000 tokens) and 5 billion max supply (5,000,000,000 tokens)
- Set up initial roles for the deployer
- Save deployment info to `deployment-devnet.json`

### Deploy to Mainnet

1. **Configure for mainnet:**
```bash
anchor config set --provider.cluster mainnet
solana config set --url https://api.mainnet-beta.solana.com
```

2. **Deploy the program:**
```bash
anchor deploy
```

3. **Initialize the token:**
```bash
SOLANA_NETWORK=mainnet node scripts/deploy.js
```

## Verification

After deployment, verify everything is working correctly:

1. **Check deployment info:**
```bash
cat deployment-devnet.json  # or deployment-mainnet.json
```

2. **Verify token configuration:**
```bash
node scripts/interact.js
```

3. **Check the token on Solana Explorer:**
   - Visit: https://explorer.solana.com
   - Search for your mint address
   - Verify token metadata and supply

## Usage Examples

### Basic Token Operations

```javascript
const { BurnMintSPLClient } = require('./scripts/interact');

// Initialize client
const client = new BurnMintSPLClient(connection, wallet, programId);

// Mint tokens to a recipient
await client.mintTokens(recipientPubkey, '1000000000000000000000'); // 1000 tokens

// Mint with CCIP metadata (for cross-chain tracking)
await client.mintTokensWithCCIP(
  recipientPubkey,
  '500000000000000000000', // 500 tokens
  'arbitrum',
  ccipMessageId
);

// Burn tokens
await client.burnTokens('100000000000000000000'); // 100 tokens

// Grant/revoke roles
await client.grantMintRole(newMinterPubkey);
await client.grantBurnRole(newBurnerPubkey);
```

### Role Management

```bash
# Grant minting permission to CCIP router
solana program deploy --program-id YOUR_PROGRAM_ID
```

## CCIP Integration

The BurnMintSPL token is designed for seamless integration with Chainlink CCIP:

### Key Features for CCIP

1. **Mint Authority**: Delegate to CCIP pool/router program
2. **Burn Authority**: Allow CCIP to burn tokens for cross-chain transfers
3. **Cross-chain Metadata**: Track source chain and message IDs
4. **Event Logging**: Comprehensive events for analytics

### CCIP Setup Steps

1. **Deploy token** using the instructions above
2. **Grant CCIP router mint/burn permissions:**
```javascript
// Grant mint role to CCIP router
await client.grantMintRole(CCIP_ROUTER_ADDRESS);
await client.grantBurnRole(CCIP_ROUTER_ADDRESS);
```

3. **Configure CCIP pools** to use your token
4. **Test cross-chain transfers** between Solana and your EVM chains

### Integration with EVM Token

Your Solana BurnMintSPL token mirrors the EVM BurnMintERC677 token:

| Feature | EVM (BurnMintERC677) | Solana (BurnMintSPL) |
|---------|---------------------|---------------------|
| Initial Supply | 4,000,000,000 tokens | 4,000,000,000 tokens |
| Max Supply | 5,000,000,000 tokens | 5,000,000,000 tokens |
| Decimals | 18 | 18 |
| Mint/Burn Roles | ✅ | ✅ |
| CCIP Compatible | ✅ | ✅ |
| Milestone Tracking | ✅ | ✅ |
| Transfer & Call | ERC677 | Custom instruction |

## Mainnet Deployment

### Pre-deployment Checklist

- [ ] Code audited and tested thoroughly on devnet
- [ ] Sufficient SOL for deployment costs (~0.1 SOL minimum)
- [ ] Backup of all keypairs and deployment info
- [ ] CCIP integration tested on testnet
- [ ] Emergency procedures documented

### Deployment Commands

```bash
# 1. Set mainnet configuration
export SOLANA_NETWORK=mainnet
export RPC_URL=https://api.mainnet-beta.solana.com
anchor config set --provider.cluster mainnet
solana config set --url https://api.mainnet-beta.solana.com

# 2. Deploy program
anchor deploy

# 3. Initialize token
node scripts/deploy.js

# 4. Verify deployment
node scripts/interact.js
```

### Post-deployment

1. **Save all deployment artifacts:**
   - Program ID
   - Mint address
   - Deployment transaction
   - All keypairs (secure backup)

2. **Verify on Solana Explorer**

3. **Set up monitoring** for:
   - Token supply changes
   - Role modifications
   - CCIP transactions

4. **Document addresses** for CCIP integration

## Security Considerations

1. **Program Upgrades**: Consider using immutable programs for mainnet
2. **Role Management**: Carefully control who has mint/burn permissions
3. **Max Supply**: Cannot be reduced once set
4. **Key Management**: Secure storage of all keypairs
5. **CCIP Integration**: Verify router addresses before granting permissions

## Troubleshooting

### Common Issues

1. **Build errors**: Ensure Rust version 1.79.0+
2. **Deploy failures**: Check SOL balance and network connectivity
3. **Transaction failures**: Verify account permissions and signatures
4. **CCIP issues**: Confirm proper role assignments

### Getting Help

- Check Anchor documentation: https://anchor-lang.com
- Solana documentation: https://docs.solana.com
- CCIP documentation: https://docs.chain.link/ccip

## Conclusion

Your BurnMintSPL token is now deployed and ready for CCIP integration! The Solana version mirrors all the functionality of your EVM token, enabling seamless cross-chain transfers while maintaining the same token economics and features.

Remember to thoroughly test on devnet before mainnet deployment and follow security best practices for handling production deployments.