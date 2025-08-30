#!/bin/bash

# Script to handle existing older version of SDM token
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

echo "🔄 Handling Existing Older Version of SDM Token"
echo "=============================================="

# Check if we're in the right directory
if [[ ! -f "Anchor.toml" ]]; then
    print_warning "Not in solana-token directory. Please run from solana-token folder."
    exit 1
fi

# Backup existing artifacts
print_info "Backing up existing build artifacts..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup target directory if it exists
if [[ -d "target" ]]; then
    cp -r target "$BACKUP_DIR/"
    print_status "Backed up target/ directory"
fi

# Backup any existing deployment files
if [[ -f "deployment-devnet.json" ]]; then
    cp deployment-devnet.json "$BACKUP_DIR/"
    print_status "Backed up deployment-devnet.json"
fi

if [[ -f "deployment-mainnet.json" ]]; then
    cp deployment-mainnet.json "$BACKUP_DIR/"
    print_status "Backed up deployment-mainnet.json"
fi

# Clean old build artifacts
print_info "Cleaning old build artifacts..."
anchor clean
rm -rf target/
rm -rf node_modules/
rm -f deployment-*.json

print_status "Cleaned old artifacts"

# Fresh install
print_info "Installing fresh dependencies..."
yarn install

print_status "Dependencies installed"

# Verify configuration
print_info "Current token configuration:"
echo "  Name: Diamondz Shadow Game + Movies"
echo "  Symbol: SDM"
echo "  Initial Supply: 4,000,000,000 tokens"
echo "  Max Supply: 5,000,000,000 tokens"
echo "  Decimals: 9"

# Check if old program ID exists in Anchor.toml
if grep -q "burn_mint_spl" Anchor.toml; then
    print_info "Found existing program ID in Anchor.toml"
    
    # Ask user if they want to keep or generate new
    echo ""
    echo "Options for handling existing program ID:"
    echo "1. Keep existing program ID (update existing deployment)"
    echo "2. Generate new program ID (fresh deployment)"
    echo ""
    read -p "Choose option (1 or 2): " choice
    
    case $choice in
        1)
            print_info "Keeping existing program ID"
            ;;
        2)
            print_info "Generating new program ID..."
            anchor keys sync
            print_status "New program ID generated"
            ;;
        *)
            print_warning "Invalid choice. Keeping existing program ID."
            ;;
    esac
fi

print_status "Old version handling complete!"
echo ""
echo "📁 Backup created in: $BACKUP_DIR"
echo ""
echo "🎯 Ready for deployment! Run: ./deploy-sdm-token.sh"