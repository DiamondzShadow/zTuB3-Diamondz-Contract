#!/bin/bash

# SDM Token Deployment Script for GCP VM
# Deploys "Diamondz Shadow Game + Movies" (SDM) token

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

print_header "SDM Token Deployment"
echo "Token: Diamondz Shadow Game + Movies (SDM)"
echo "=============================================="

# Check if we're in the right directory
if [[ ! -f "Anchor.toml" ]]; then
    print_error "Not in solana-token directory. Please run from solana-token folder."
    exit 1
fi

# Check environment setup
print_info "Checking environment setup..."

# Check Rust
if ! command -v rustc &> /dev/null; then
    print_error "Rust not found. Please run gcp-vm-setup.sh first."
    exit 1
fi

# Check Solana CLI
if ! command -v solana &> /dev/null; then
    print_error "Solana CLI not found. Please run gcp-vm-setup.sh first."
    exit 1
fi

# Check Anchor
if ! command -v anchor &> /dev/null; then
    print_error "Anchor not found. Please run gcp-vm-setup.sh first."
    exit 1
fi

print_status "Environment check passed"

# Check wallet
if [[ ! -f "$HOME/.config/solana/id.json" ]]; then
    print_error "Solana wallet not found. Creating one now..."
    mkdir -p ~/.config/solana
    solana-keygen new --outfile ~/.config/solana/id.json
fi

export ANCHOR_WALLET=~/.config/solana/id.json
WALLET_ADDRESS=$(solana address)
print_info "Wallet address: $WALLET_ADDRESS"

# Choose network
echo ""
echo "Choose deployment network:"
echo "1. Devnet (recommended for testing)"
echo "2. Mainnet (production deployment)"
echo ""
read -p "Enter choice (1 or 2): " network_choice

case $network_choice in
    1)
        NETWORK="devnet"
        RPC_URL="https://api.devnet.solana.com"
        print_info "Selected: Devnet"
        ;;
    2)
        NETWORK="mainnet"
        RPC_URL="https://api.mainnet-beta.solana.com"
        print_warning "Selected: Mainnet (production)"
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Configure network
print_info "Configuring for $NETWORK..."
export SOLANA_NETWORK=$NETWORK
export RPC_URL=$RPC_URL
anchor config set --provider.cluster $NETWORK
solana config set --url $RPC_URL

# Check balance
BALANCE=$(solana balance --lamports)
BALANCE_SOL=$(echo "scale=4; $BALANCE / 1000000000" | bc -l)
print_info "Current balance: $BALANCE_SOL SOL"

if [[ $NETWORK == "devnet" ]]; then
    if (( $(echo "$BALANCE_SOL < 0.1" | bc -l) )); then
        print_info "Requesting devnet airdrop..."
        solana airdrop 2
        print_status "Airdrop completed"
    fi
elif [[ $NETWORK == "mainnet" ]]; then
    if (( $(echo "$BALANCE_SOL < 0.1" | bc -l) )); then
        print_error "Insufficient SOL for mainnet deployment. Need at least 0.1 SOL."
        print_info "Please transfer SOL to: $WALLET_ADDRESS"
        exit 1
    fi
fi

# Build the program
print_info "Building Anchor program..."
anchor build

# Verify build
if [[ ! -f "target/deploy/burn_mint_spl.so" ]]; then
    print_error "Build failed. Program binary not found."
    exit 1
fi

print_status "Program built successfully"

# Deploy the program
print_info "Deploying program to $NETWORK..."
anchor deploy

print_status "Program deployed successfully"

# Initialize the token
print_info "Initializing SDM token..."
if [[ $NETWORK == "devnet" ]]; then
    yarn deploy:devnet
else
    yarn deploy:mainnet
fi

print_status "Token initialized successfully"

# Show deployment info
echo ""
print_header "DEPLOYMENT COMPLETE! 🎉"
echo ""
print_info "Token Details:"
echo "  Name: Diamondz Shadow Game + Movies"
echo "  Symbol: SDM"
echo "  Network: $NETWORK"
echo "  Deployer: $WALLET_ADDRESS"

if [[ -f "deployment-$NETWORK.json" ]]; then
    MINT_ADDRESS=$(cat "deployment-$NETWORK.json" | grep -o '"mint":"[^"]*"' | cut -d'"' -f4)
    PROGRAM_ID=$(cat "deployment-$NETWORK.json" | grep -o '"programId":"[^"]*"' | cut -d'"' -f4)
    
    echo "  Mint Address: $MINT_ADDRESS"
    echo "  Program ID: $PROGRAM_ID"
    
    print_info "Deployment file saved: deployment-$NETWORK.json"
    
    # Show explorer links
    if [[ $NETWORK == "mainnet" ]]; then
        echo ""
        print_info "View on Solana Explorer:"
        echo "  Token: https://explorer.solana.com/address/$MINT_ADDRESS"
        echo "  Program: https://explorer.solana.com/address/$PROGRAM_ID"
    else
        echo ""
        print_info "View on Solana Explorer (Devnet):"
        echo "  Token: https://explorer.solana.com/address/$MINT_ADDRESS?cluster=devnet"
        echo "  Program: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
    fi
fi

echo ""
print_status "Your SDM token is now live on Solana $NETWORK!"
print_info "The token will display as 'Diamondz Shadow Game + Movies' (SDM) in wallets and explorers."

# Test interaction
echo ""
read -p "Would you like to test token interaction? (y/n): " test_choice
if [[ $test_choice == "y" || $test_choice == "Y" ]]; then
    print_info "Running interaction test..."
    if [[ $NETWORK == "devnet" ]]; then
        yarn interact:devnet
    else
        yarn interact:mainnet
    fi
fi

echo ""
print_header "Deployment process complete! 🚀"