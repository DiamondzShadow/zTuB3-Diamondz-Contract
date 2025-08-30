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

# Check if user has existing wallet
if [[ -f ~/.config/solana/id.json ]]; then
    echo "Found existing wallet"
    export ANCHOR_WALLET=~/.config/solana/id.json
    WALLET=$(solana address)
    echo "Using wallet: $WALLET"
else
    echo "No wallet found. Options:"
    echo "1 = Import your existing wallet"
    echo "2 = Create new wallet"
    read -p "Enter 1 or 2: " wallet_choice
    
    if [[ $wallet_choice == "1" ]]; then
        echo "Enter your wallet private key or seed phrase:"
        solana-keygen recover 'prompt:?key=0/0' --outfile ~/.config/solana/id.json
        echo "✅ Wallet imported"
    else
        solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase
        echo "✅ New wallet created"
    fi
    
    export ANCHOR_WALLET=~/.config/solana/id.json
    WALLET=$(solana address)
    echo "Wallet: $WALLET"
fi

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
    
    # Configure and get free SOL
    solana config set --url $RPC
    echo "Getting free devnet SOL..."
    solana airdrop 2
    
elif [[ $choice == "2" ]]; then
    NETWORK="mainnet"
    RPC="https://api.mainnet-beta.solana.com"
    echo "Using Mainnet"
    
    # Configure mainnet
    solana config set --url $RPC
    BALANCE=$(solana balance)
    echo "Your balance: $BALANCE"
    
    # Check if enough SOL
    BALANCE_NUM=$(echo $BALANCE | cut -d' ' -f1)
    if (( $(echo "$BALANCE_NUM < 0.1" | bc -l) )); then
        echo "❌ You need at least 0.1 SOL for deployment"
        echo "Your wallet: $WALLET"
        echo "Send SOL to your wallet and run this script again"
        exit 1
    fi
    
    echo "✅ You have enough SOL to deploy"
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