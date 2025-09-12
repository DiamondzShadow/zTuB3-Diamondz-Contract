#!/bin/bash
# Automated Verification Script for SDM Token
# Generated: 2025-09-10 02:41:04

# Load environment variables
if [ -f .env ]; then
  source .env
fi

CONTRACT_ADDRESS="0x602b869eEf1C9F0487F31776bad8Af3C4A173394"

# Check for API key
if [ -z "$ARBISCAN_API_KEY" ]; then
  echo "⚠️  Error: ARBISCAN_API_KEY not found in environment variables."
  echo "   Please set it in your .env file."
  echo "   Copy .env.example to .env and add your API key."
  exit 1
fi

echo "Starting contract verification for SDM Token..."

# If using Hardhat
if [ -f "hardhat.config.js" ]; then
    echo "Detected Hardhat project"
    npx hardhat verify --network arbitrum $CONTRACT_ADDRESS
fi

# If using Foundry
if [ -f "foundry.toml" ]; then
    echo "Detected Foundry project"
    forge verify-contract \
        $CONTRACT_ADDRESS \
        src/DiamondzShadowGameMovies.sol:DiamondzShadowGameMovies \
        --chain arbitrum \
        --etherscan-api-key $ARBISCAN_API_KEY \
        --watch
fi

# Manual verification URL
echo ""
echo "For manual verification, visit:"
echo "https://arbiscan.io/verifyContract?a=$CONTRACT_ADDRESS"
echo ""
echo "API Key: $ARBISCAN_API_KEY"
