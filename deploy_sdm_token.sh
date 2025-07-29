#!/bin/bash

# Token Configuration
export TOKEN_NAME="Diamondz Shadow Game + Movies"
export TOKEN_SYMBOL="SDM"

# IMPORTANT: Replace these with your actual values
export INITIAL_ACCOUNT="0x_YOUR_WALLET_ADDRESS_HERE"
export PRIVATE_KEY="0x_YOUR_PRIVATE_KEY_HERE"
export RPC_URL="https://hardworking-greatest-road.diamondz-zslab.quiknode.pro/"

# Optional: For contract verification on Etherscan
# export ETHERSCAN_API_KEY="YOUR-ETHERSCAN-API-KEY"

echo "Deploying SDM Token (Diamondz Shadow Game + Movies)"
echo "Token Name: $TOKEN_NAME"
echo "Token Symbol: $TOKEN_SYMBOL"
echo "Initial Account: $INITIAL_ACCOUNT"
echo "RPC URL: $RPC_URL"
echo ""

# Deploy the contract
forge script script/DeployBurnMintERC677.s.sol:DeployBurnMintERC677 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# If you want to verify on Etherscan, uncomment the following:
# forge script script/DeployBurnMintERC677.s.sol:DeployBurnMintERC677 \
#   --rpc-url $RPC_URL \
#   --private-key $PRIVATE_KEY \
#   --broadcast \
#   --verify