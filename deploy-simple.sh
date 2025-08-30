#!/bin/bash

# SUPER SIMPLE SDM TOKEN DEPLOYMENT
# For GCP VM with existing wallet and SOL

echo "💎 Deploying SDM Token: Diamondz Shadow Game + Movies"

# Quick installs
sudo apt update -y
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source ~/.cargo/env
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g yarn
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest

echo "✅ Software installed"

# Setup wallet
echo "🔑 Setting up wallet..."
mkdir -p ~/.config/solana

# Check if wallet already exists
if [[ -f ~/.config/solana/id.json ]]; then
    echo "✅ Found existing wallet"
    export ANCHOR_WALLET=~/.config/solana/id.json
    WALLET=$(solana address)
    echo "Using wallet: $WALLET"
else
    echo "No wallet found. Choose option:"
    echo "1 = Import your existing wallet (recommended)"
    echo "2 = Create new wallet"
    read -p "Enter 1 or 2: " wallet_choice
    
    if [[ $wallet_choice == "1" ]]; then
        echo "Importing your wallet..."
        echo "When prompted, enter your seed phrase (12 or 24 words)"
        solana-keygen recover --outfile ~/.config/solana/id.json
        echo "✅ Wallet imported"
    else
        echo "Creating new wallet..."
        solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase
        echo "✅ New wallet created"
        echo "⚠️  SAVE YOUR SEED PHRASE! You'll need it to recover your wallet."
    fi
    
    export ANCHOR_WALLET=~/.config/solana/id.json
    WALLET=$(solana address)
    echo "Using wallet: $WALLET"
fi

# Choose network
echo "1 = Devnet (testing)"
echo "2 = Mainnet (production)"
read -p "Choose: " net

if [[ $net == "1" ]]; then
    solana config set --url https://api.devnet.solana.com
    NETWORK="devnet"
    echo "Using devnet"
else
    solana config set --url https://api.mainnet-beta.solana.com
    NETWORK="mainnet"
    echo "Using mainnet"
fi

echo "Balance: $(solana balance)"

# Deploy
echo "📁 Checking project structure..."
if [[ ! -d "solana-token" ]]; then
    echo "❌ solana-token directory not found!"
    echo "Make sure you're in the correct project directory"
    echo "Current directory: $(pwd)"
    echo "Contents: $(ls -la)"
    exit 1
fi

cd solana-token
echo "✅ Found solana-token directory"

# Clean old builds
echo "🧹 Cleaning old builds..."
rm -rf target/ node_modules/ deployment-*.json || true

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Configure and build
echo "🔨 Building program..."
anchor config set --provider.cluster $NETWORK
anchor build

# Verify build
if [[ ! -f "target/deploy/burn_mint_spl.so" ]]; then
    echo "❌ Build failed - program binary not found"
    exit 1
fi

echo "✅ Build successful"

# Deploy program
echo "🚀 Deploying program to $NETWORK..."
anchor deploy

export SOLANA_NETWORK=$NETWORK
if [[ $NETWORK == "devnet" ]]; then
    yarn deploy:devnet
else
    yarn deploy:mainnet
fi

echo ""
echo "🎉 SDM TOKEN DEPLOYED!"
echo "Name: Diamondz Shadow Game + Movies"
echo "Symbol: SDM"

# Show mint address
if [[ -f "deployment-$NETWORK.json" ]]; then
    MINT=$(grep -o '"mint":"[^"]*"' deployment-$NETWORK.json | cut -d'"' -f4)
    echo "Mint: $MINT"
    
    if [[ $NETWORK == "mainnet" ]]; then
        echo "View: https://explorer.solana.com/address/$MINT"
    else
        echo "View: https://explorer.solana.com/address/$MINT?cluster=devnet"
    fi
fi