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

# Import your wallet
echo "🔑 Import your wallet with SOL:"
echo "Enter your private key or seed phrase:"
mkdir -p ~/.config/solana
solana-keygen recover 'prompt:?key=0/0' --outfile ~/.config/solana/id.json

export ANCHOR_WALLET=~/.config/solana/id.json
WALLET=$(solana address)
echo "Using wallet: $WALLET"

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
cd solana-token
rm -rf target/ node_modules/ || true
yarn install
anchor config set --provider.cluster $NETWORK
anchor build
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