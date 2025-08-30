#!/bin/bash

# SUPER SIMPLE SDM TOKEN DEPLOYMENT
# For GCP VM with existing wallet and SOL
# Usage: ./deploy-simple.sh [PROJECT_DIR]

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Configuration
readonly SCRIPT_NAME="$(basename "$0")"
readonly TOKEN_NAME="Diamondz Shadow Game + Movies"
readonly TOKEN_SYMBOL="SDM"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Helper functions
print_error() {
    echo -e "${RED}❌ $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "💎 Deploying SDM Token: $TOKEN_NAME ($TOKEN_SYMBOL)"

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

print_success "Software installed"

# Setup wallet
echo "🔑 Setting up wallet..."
mkdir -p ~/.config/solana

# Check if wallet already exists
readonly WALLET_PATH="$HOME/.config/solana/id.json"

if [[ -f "$WALLET_PATH" ]]; then
    print_success "Found existing wallet"
    export ANCHOR_WALLET="$WALLET_PATH"
    WALLET=$(solana address)
    print_info "Using wallet: $WALLET"
else
    print_info "No wallet found. Choose option:"
    echo "1 = Import your existing wallet (recommended)"
    echo "2 = Create new wallet"
    read -p "Enter 1 or 2: " wallet_choice
    
    case "$wallet_choice" in
        1)
            print_info "Importing your wallet..."
            echo "When prompted, enter your seed phrase (12 or 24 words)"
            solana-keygen recover --outfile "$WALLET_PATH" || {
                print_error "Failed to import wallet"
                exit 1
            }
            print_success "Wallet imported"
            ;;
        2)
            print_info "Creating new wallet..."
            solana-keygen new --outfile "$WALLET_PATH" --no-bip39-passphrase || {
                print_error "Failed to create wallet"
                exit 1
            }
            print_success "New wallet created"
            print_warning "SAVE YOUR SEED PHRASE! You'll need it to recover your wallet."
            ;;
        *)
            print_error "Invalid choice. Please enter 1 or 2."
            exit 1
            ;;
    esac
    
    export ANCHOR_WALLET="$WALLET_PATH"
    WALLET=$(solana address)
    print_info "Using wallet: $WALLET"
fi

# Choose network with improved validation
print_info "Choose deployment network:"
echo "1 = Devnet (testing)"
echo "2 = Mainnet (production)"
read -p "Enter 1 or 2: " net

case "$net" in
    1)
        readonly NETWORK="devnet"
        readonly RPC_URL="https://api.devnet.solana.com"
        print_info "Selected: Devnet (testing)"
        ;;
    2)
        readonly NETWORK="mainnet"
        readonly RPC_URL="https://api.mainnet-beta.solana.com"
        print_warning "Selected: Mainnet (production)"
        ;;
    *)
        print_error "Invalid choice. Please enter 1 or 2."
        exit 1
        ;;
esac

# Configure network
print_info "Configuring Solana CLI for $NETWORK..."
solana config set --url "$RPC_URL" || {
    print_error "Failed to configure Solana CLI"
    exit 1
}

# Check balance
print_info "Checking wallet balance..."
BALANCE=$(solana balance) || {
    print_error "Failed to check balance. Is your wallet configured correctly?"
    exit 1
}
print_info "Balance: $BALANCE"

# Deploy - with improved path handling
echo "📁 Checking project structure..."

# Use command line argument, environment variable, or default
readonly PROJECT_DIR="${1:-${PROJECT_DIR:-solana-token}}"

# Robust directory validation
if [[ ! -d "$PROJECT_DIR" ]]; then
    print_error "Directory '$PROJECT_DIR' does not exist!"
    print_info "Current directory: $(pwd)"
    print_info "Available directories:"
    ls -la | grep "^d" || echo "No directories found"
    echo ""
    print_info "💡 Solutions:"
    echo "1. Make sure you're in the project root directory"
    echo "2. Run: $SCRIPT_NAME /path/to/solana-token"
    echo "3. Set PROJECT_DIR: export PROJECT_DIR=/path/to/solana-token"
    echo "4. Clone repo: git clone https://github.com/DiamondzShadow/zTuB3-Diamondz-Contract.git"
    exit 1
fi

# Safely change directory
print_info "Entering directory: $PROJECT_DIR"
cd "$PROJECT_DIR" || {
    print_error "Failed to enter directory '$PROJECT_DIR'"
    exit 1
}

# Verify we're in the right place
if [[ ! -f "Anchor.toml" ]]; then
    print_error "Not a valid Solana project directory (missing Anchor.toml)"
    print_info "Current directory: $(pwd)"
    print_info "Contents: $(ls -la)"
    exit 1
fi

print_success "Verified Solana project directory"

# Clean old builds
print_info "Cleaning old builds..."
rm -rf target/ node_modules/ deployment-*.json || true

# Install dependencies
print_info "Installing dependencies..."
yarn install || {
    print_error "Failed to install dependencies"
    exit 1
}

# Configure and build
print_info "Building program..."
anchor config set --provider.cluster "$NETWORK" || {
    print_error "Failed to configure Anchor"
    exit 1
}

anchor build || {
    print_error "Build failed"
    exit 1
}

# Verify build
readonly PROGRAM_BINARY="target/deploy/burn_mint_spl.so"
if [[ ! -f "$PROGRAM_BINARY" ]]; then
    print_error "Build failed - program binary not found at $PROGRAM_BINARY"
    exit 1
fi

print_success "Build successful"

# Deploy program
print_info "Deploying program to $NETWORK..."
anchor deploy || {
    print_error "Program deployment failed"
    exit 1
}

# Deploy token
print_info "Initializing $TOKEN_NAME token..."
export SOLANA_NETWORK="$NETWORK"
export RPC_URL="$RPC_URL"

if [[ "$NETWORK" == "devnet" ]]; then
    yarn deploy:devnet || {
        print_error "Token deployment to devnet failed"
        exit 1
    }
else
    yarn deploy:mainnet || {
        print_error "Token deployment to mainnet failed"
        exit 1
    }
fi

echo ""
print_success "SDM TOKEN DEPLOYED SUCCESSFULLY!"
print_info "Token Details:"
echo "  Name: $TOKEN_NAME"
echo "  Symbol: $TOKEN_SYMBOL"
echo "  Network: $NETWORK"

# Show mint address with improved parsing
readonly DEPLOYMENT_FILE="deployment-$NETWORK.json"
if [[ -f "$DEPLOYMENT_FILE" ]]; then
    if command -v jq &> /dev/null; then
        MINT=$(jq -r '.mint' "$DEPLOYMENT_FILE")
    else
        MINT=$(grep -o '"mint":"[^"]*"' "$DEPLOYMENT_FILE" | cut -d'"' -f4)
    fi
    
    print_info "Mint Address: $MINT"
    
    if [[ "$NETWORK" == "mainnet" ]]; then
        print_info "View on Explorer: https://explorer.solana.com/address/$MINT"
    else
        print_info "View on Explorer: https://explorer.solana.com/address/$MINT?cluster=devnet"
    fi
else
    print_warning "Deployment file not found - check console output for mint address"
fi

print_success "Deployment complete! Your token shows as '$TOKEN_NAME' not 'SPL Token'"