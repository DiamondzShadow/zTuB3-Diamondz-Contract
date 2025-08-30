#!/bin/bash

# GCP VM Setup Script for SDM Token Deployment
# This script handles the complete setup on your GCP VM

set -e

echo "🌟 Setting up GCP VM for SDM Token Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running on GCP VM
if [[ -f /sys/class/dmi/id/product_name ]] && grep -q "Google" /sys/class/dmi/id/product_name; then
    print_info "Detected Google Cloud Platform VM"
else
    print_warning "Not detected as GCP VM, but continuing anyway..."
fi

# Update system
print_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install basic dependencies
print_info "Installing basic dependencies..."
sudo apt install -y curl wget git build-essential pkg-config libudev-dev

# Install Rust
print_info "Installing Rust..."
if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
    rustup update stable
    rustup default stable
    print_status "Rust installed successfully"
else
    print_status "Rust already installed"
fi

# Verify Rust version
RUST_VERSION=$(rustc --version | awk '{print $2}')
print_info "Rust version: $RUST_VERSION"

# Install Solana CLI
print_info "Installing Solana CLI..."
if ! command -v solana &> /dev/null; then
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
    print_status "Solana CLI installed successfully"
else
    print_status "Solana CLI already installed"
fi

# Verify Solana version
SOLANA_VERSION=$(solana --version | awk '{print $2}')
print_info "Solana CLI version: $SOLANA_VERSION"

# Install Anchor
print_info "Installing Anchor Framework..."
if ! command -v anchor &> /dev/null; then
    cargo install --git https://github.com/coral-xyz/anchor avm --locked
    avm install latest
    avm use latest
    print_status "Anchor installed successfully"
else
    print_status "Anchor already installed"
fi

# Install Node.js and Yarn
print_info "Installing Node.js and Yarn..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js installed successfully"
else
    print_status "Node.js already installed"
fi

if ! command -v yarn &> /dev/null; then
    npm install -g yarn
    print_status "Yarn installed successfully"
else
    print_status "Yarn already installed"
fi

# Verify versions
NODE_VERSION=$(node --version)
YARN_VERSION=$(yarn --version)
print_info "Node.js version: $NODE_VERSION"
print_info "Yarn version: $YARN_VERSION"

print_status "Environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Run: source ~/.bashrc"
echo "2. Run: ./handle-old-version.sh"
echo "3. Run: ./deploy-sdm-token.sh"