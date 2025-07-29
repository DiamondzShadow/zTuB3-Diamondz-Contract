#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.

# Source configuration files
source ./deploy_commands.sh
if [ -f .env ]; then
  source .env
else
  echo "Error: .env file not found. Please create it from .env.example and add your secrets."
  exit 1
fi

# Validate that required variables are set
if [ -z "$INITIAL_ACCOUNT" ] || [ -z "$PRIVATE_KEY" ] || [ -z "$RPC_URL" ]; then
    echo "Error: Please ensure INITIAL_ACCOUNT, PRIVATE_KEY, and RPC_URL are set in your .env file."
    exit 1
fi

# Validate that placeholder values have been replaced
if [[ "$INITIAL_ACCOUNT" == "0x_YOUR_WALLET_ADDRESS_HERE" ]] || [[ "$PRIVATE_KEY" == "0x_YOUR_PRIVATE_KEY_HERE" ]]; then
    echo "Error: Please replace placeholder values in your .env file with actual values."
    exit 1
fi

echo "Deploying SDM Token (Diamondz Shadow Game + Movies)"
echo "Token Name: $TOKEN_NAME"
echo "Token Symbol: $TOKEN_SYMBOL"
echo "Initial Account: $INITIAL_ACCOUNT"
echo "RPC URL: $RPC_URL"
echo ""

# Deploy the contract
forge script script/DeployBurnMintERC677.s.sol:DeployBurnMintERC677 \
  --rpc-url $RPC_URL \
  --broadcast

# If verification is desired and API key is provided
if [ ! -z "$ETHERSCAN_API_KEY" ]; then
    echo ""
    echo "Verifying contract on Etherscan..."
    forge script script/DeployBurnMintERC677.s.sol:DeployBurnMintERC677 \
      --rpc-url $RPC_URL \
      --broadcast \
      --verify \
      --etherscan-api-key $ETHERSCAN_API_KEY
fi