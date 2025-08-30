# GCP VM Deployment Guide for SDM Token

## 🚀 Deploying "Diamondz Shadow Game + Movies" (SDM) Token from GCP VM

This guide will help you deploy the **"Diamondz Shadow Game + Movies"** token with symbol **"SDM"** from your GCP VM, handling the existing older version properly.

## Current Token Configuration
- **Name**: `"Diamondz Shadow Game + Movies"`
- **Symbol**: `"SDM"`
- **Initial Supply**: 4,000,000,000 tokens (4 billion)
- **Max Supply**: 5,000,000,000 tokens (5 billion)
- **Decimals**: 9 (Solana standard)

---

## Step 1: Handle Existing Older Version

Since you have an older version with the same name, let's handle this properly:

### Option A: Backup and Clean Start (Recommended)
```bash
# 1. Backup your existing project
cd ~
mv existing-project-directory existing-project-backup-$(date +%Y%m%d)

# 2. Clone the latest version
git clone https://github.com/DiamondzShadow/zTuB3-Diamondz-Contract.git
cd zTuB3-Diamondz-Contract/solana-token
```

### Option B: Update Existing Project
```bash
# 1. Navigate to your existing project
cd /path/to/your/existing/project

# 2. Backup current state
git stash push -m "backup before update"

# 3. Pull latest changes
git fetch origin
git checkout main
git pull origin main

# 4. Navigate to Solana token directory
cd solana-token
```

---

## Step 2: GCP VM Environment Setup

### Install Required Software

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Rust (required version 1.79.0+)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup update stable
rustup default stable

# Verify Rust installation
rustc --version  # Should show 1.79.0 or newer

# 3. Install Solana CLI (version 1.18.26)
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Add to your shell profile for persistence
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

# Verify Solana installation
solana --version  # Should show 1.18.26 or compatible

# 4. Install Anchor Framework
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest

# Verify Anchor installation
anchor --version  # Should show 0.31.1 or newer

# 5. Install Node.js and Yarn
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g yarn

# Verify installations
node --version
yarn --version
```

---

## Step 3: Wallet Setup

### Create or Import Your Solana Wallet

```bash
# Option A: Create new wallet (if you don't have one)
solana-keygen new --outfile ~/.config/solana/id.json

# Option B: Import existing wallet (if you have the private key)
solana-keygen recover 'prompt:?key=0/0' --outfile ~/.config/solana/id.json

# Set wallet as default
export ANCHOR_WALLET=~/.config/solana/id.json
echo 'export ANCHOR_WALLET=~/.config/solana/id.json' >> ~/.bashrc

# Check your wallet address
solana address
```

### Fund Your Wallet

```bash
# For devnet testing (free)
solana config set --url https://api.devnet.solana.com
solana airdrop 2

# For mainnet deployment (transfer SOL from exchange)
# You'll need at least 0.1 SOL for deployment costs
solana config set --url https://api.mainnet-beta.solana.com
# Transfer SOL from your exchange/wallet to the address shown by 'solana address'
```

---

## Step 4: Project Setup

```bash
# Navigate to the solana-token directory
cd solana-token

# Install dependencies
yarn install

# Configure environment
export SOLANA_NETWORK=devnet  # or mainnet for production
export RPC_URL=https://api.devnet.solana.com  # or mainnet RPC

# Add to shell profile
echo 'export SOLANA_NETWORK=devnet' >> ~/.bashrc
echo 'export RPC_URL=https://api.devnet.solana.com' >> ~/.bashrc
```

---

## Step 5: Build and Deploy

### Build the Program
```bash
# Build the Anchor program
anchor build

# Verify build output
ls -la target/deploy/
ls -la target/idl/
```

You should see:
- `target/deploy/burn_mint_spl.so` (compiled program)
- `target/idl/burn_mint_spl.json` (interface definition)

### Deploy to Devnet (Recommended First)
```bash
# 1. Configure for devnet
anchor config set --provider.cluster devnet
solana config set --url https://api.devnet.solana.com

# 2. Deploy the program
anchor deploy

# 3. Initialize the token with proper name
yarn deploy:devnet
```

This will deploy the token with:
- **Name**: "Diamondz Shadow Game + Movies"
- **Symbol**: "SDM"
- **Initial Supply**: 4,000,000,000 tokens
- **Max Supply**: 5,000,000,000 tokens

### Deploy to Mainnet (Production)
```bash
# 1. Configure for mainnet
anchor config set --provider.cluster mainnet
solana config set --url https://api.mainnet-beta.solana.com

# 2. Ensure you have sufficient SOL
solana balance  # Should show at least 0.1 SOL

# 3. Deploy the program
anchor deploy

# 4. Initialize the token
yarn deploy:mainnet
```

---

## Step 6: Verification

### Test Your Deployment
```bash
# Interact with your deployed token
yarn interact:devnet  # or yarn interact:mainnet

# Check deployment info
cat deployment-devnet.json  # or deployment-mainnet.json
```

### Verify on Solana Explorer
1. Go to https://explorer.solana.com
2. Search for your mint address (from deployment output)
3. Verify the token shows as **"Diamondz Shadow Game + Movies"** with symbol **"SDM"**

---

## Step 7: Handle Old Version Conflict

If you encounter issues with the old version:

### Clean Slate Approach
```bash
# 1. Remove old Anchor artifacts
rm -rf ~/.config/solana/cli/cache/
rm -rf target/

# 2. Rebuild everything
anchor clean
anchor build
anchor deploy
```

### Update Program ID (if needed)
If you need a new program ID:
```bash
# Generate new keypair for the program
solana-keygen new --outfile target/deploy/burn_mint_spl-keypair.json

# Update Anchor.toml with new program ID
anchor keys sync
```

---

## Quick Commands Summary

```bash
# Complete setup from scratch
cd ~/
git clone https://github.com/DiamondzShadow/zTuB3-Diamondz-Contract.git
cd zTuB3-Diamondz-Contract/solana-token
yarn install
anchor build

# Deploy to devnet
export SOLANA_NETWORK=devnet
anchor config set --provider.cluster devnet
solana config set --url https://api.devnet.solana.com
anchor deploy
yarn deploy:devnet

# Deploy to mainnet (when ready)
export SOLANA_NETWORK=mainnet
anchor config set --provider.cluster mainnet
solana config set --url https://api.mainnet-beta.solana.com
anchor deploy
yarn deploy:mainnet
```

---

## Expected Output

When deployment succeeds, you'll see:
```
🚀 Deploying BurnMintSPL token to mainnet...
📋 Program ID: [your-program-id]
👛 Deployer: [your-wallet-address]
💰 Deployer balance: [your-sol-balance] SOL

✅ Token initialized successfully!
   Name: Diamondz Shadow Game + Movies
   Symbol: SDM
   Decimals: 9
   Initial Supply: 4,000,000,000 SDM
   Max Supply: 5,000,000,000 SDM

🎉 DEPLOYMENT COMPLETE!
```

Your token will show up in wallets and explorers as **"Diamondz Shadow Game + Movies"** with the symbol **"SDM"**, not as a generic "SPL Token".

---

## Troubleshooting

1. **Old version conflicts**: Use the clean slate approach above
2. **Insufficient SOL**: Transfer more SOL to your wallet
3. **Build errors**: Ensure Rust version 1.79.0+
4. **Network issues**: Check your GCP VM's internet connectivity
5. **Permission errors**: Ensure proper wallet setup and funding

Need help with any specific step? Let me know!