#!/bin/bash

# ONE-COMMAND SDM TOKEN DEPLOYMENT
# Just run: ./deploy-now.sh
# Token: "Diamondz Shadow Game + Movies" (SDM)

set -e

echo "🚀 DEPLOYING SDM TOKEN - Diamondz Shadow Game + Movies"
echo "======================================================"

# Install everything automatically
echo "📦 Installing required software..."

# Update system
sudo apt update -y

# Install Rust
if ! command -v rustc &> /dev/null; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
fi

# Install Solana CLI
if ! command -v solana &> /dev/null; then
    echo "Installing Solana CLI..."
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
fi

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install Yarn
if ! command -v yarn &> /dev/null; then
    echo "Installing Yarn..."
    npm install -g yarn
fi

# Install Anchor
if ! command -v anchor &> /dev/null; then
    echo "Installing Anchor..."
    cargo install --git https://github.com/coral-xyz/anchor avm --locked
    avm install latest
    avm use latest
fi

echo "✅ All software installed!"

# Setup wallet
echo "🔑 Setting up wallet..."
mkdir -p ~/.config/solana
if [[ ! -f ~/.config/solana/id.json ]]; then
    solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase
fi

export ANCHOR_WALLET=~/.config/solana/id.json
WALLET=$(solana address)
echo "Wallet: $WALLET"

# Choose network
echo ""
echo "Choose network:"
echo "1 = Devnet (free, for testing)"
echo "2 = Mainnet (costs SOL, for production)"
read -p "Enter 1 or 2: " choice

if [[ $choice == "1" ]]; then
    NETWORK="devnet"
    RPC="https://api.devnet.solana.com"
    echo "Using Devnet"
    
    # Get free SOL
    solana config set --url $RPC
    solana airdrop 2
    
elif [[ $choice == "2" ]]; then
    NETWORK="mainnet"
    RPC="https://api.mainnet-beta.solana.com"
    echo "Using Mainnet"
    
    solana config set --url $RPC
    BALANCE=$(solana balance)
    echo "Balance: $BALANCE"
    echo "⚠️  Make sure you have at least 0.1 SOL for deployment"
    read -p "Continue? (y/n): " confirm
    if [[ $confirm != "y" ]]; then
        exit 1
    fi
else
    echo "Invalid choice"
    exit 1
fi

# Go to project directory
cd solana-token

# Clean old stuff
echo "🧹 Cleaning old build..."
rm -rf target/ node_modules/ deployment-*.json || true

# Install dependencies
echo "📦 Installing project dependencies..."
yarn install

# Configure Anchor
anchor config set --provider.cluster $NETWORK

# Build
echo "🔨 Building program..."
anchor build

# Deploy program
echo "🚀 Deploying program..."
anchor deploy

# Deploy token
echo "💎 Deploying SDM token..."
export SOLANA_NETWORK=$NETWORK
export RPC_URL=$RPC

if [[ $NETWORK == "devnet" ]]; then
    yarn deploy:devnet
else
    yarn deploy:mainnet
fi

echo ""
echo "🎉 SUCCESS! SDM TOKEN DEPLOYED!"
echo "================================"
echo "Name: Diamondz Shadow Game + Movies"
echo "Symbol: SDM"
echo "Network: $NETWORK"

# Show mint address
if [[ -f "deployment-$NETWORK.json" ]]; then
    MINT=$(grep -o '"mint":"[^"]*"' deployment-$NETWORK.json | cut -d'"' -f4)
    echo "Mint Address: $MINT"
    
    if [[ $NETWORK == "mainnet" ]]; then
        echo "View: https://explorer.solana.com/address/$MINT"
    else
        echo "View: https://explorer.solana.com/address/$MINT?cluster=devnet"
    fi
fi

echo ""
echo "✅ Your token is live and shows the correct name!"