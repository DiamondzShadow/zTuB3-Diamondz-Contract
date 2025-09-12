#!/bin/bash

echo "🚀 Final BurnMintERC677 Verification Script"
echo "=========================================="
echo ""

# Load environment variables
if [ -f .env ]; then
  source .env
fi

# Set variables
CONTRACT_ADDRESS="0x602b869eEf1C9F0487F31776bad8Af3C4A173394"

# Check for API key
if [ -z "$ARBISCAN_API_KEY" ]; then
  echo "⚠️  Warning: ARBISCAN_API_KEY not found in environment variables."
  echo "   Please set it in your .env file."
  echo "   Copy .env.example to .env and add your API key."
  echo ""
  exit 1
fi

# Constructor arguments (no 0x prefix)
CONSTRUCTOR_ARGS="000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000018b2b2ce7d05bfe0883ff874ba0c536a89d07363000000000000000000000000000000000000000000000000000000000000001d4469616d6f6e647a20536861646f772047616d65202b204d6f766965730000000000000000000000000000000000000000000000000000000000000000000003534d0000000000000000000000000000000000000000000000000000000000"

echo "Contract: $CONTRACT_ADDRESS"
echo "Network: Arbitrum"
echo "Compiler: v0.8.19"
echo "Optimizer Runs: 10000 (from foundry.toml)"
echo ""

# Try with Forge first
echo "Method 1: Using Forge with correct settings"
echo "-------------------------------------------"
forge verify-contract $CONTRACT_ADDRESS \
  src/tokens/BurnMintERC677.sol:BurnMintERC677 \
  --chain arbitrum \
  --etherscan-api-key $ARBISCAN_API_KEY \
  --compiler-version v0.8.19+commit.7dd6d404 \
  --num-of-optimizations 10000 \
  --constructor-args $CONSTRUCTOR_ARGS \
  --watch

if [ $? -eq 0 ]; then
  echo "✅ Verification successful!"
  exit 0
fi

echo ""
echo "Method 2: Manual Verification Instructions"
echo "-------------------------------------------"
echo ""
echo "Since automatic verification failed, please verify manually:"
echo ""
echo "1. Go to: https://arbiscan.io/verifyContract?a=$CONTRACT_ADDRESS"
echo ""
echo "2. Enter these EXACT settings:"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Compiler Type: Solidity (Single file)"
echo "   Compiler Version: v0.8.19+commit.7dd6d404"
echo "   Open Source License Type: 3 (MIT)"
echo ""
echo "3. Optimization Settings:"
echo "   Optimization: Yes"
echo "   Runs: 10000  <-- IMPORTANT: Not 200!"
echo "   EVM Version: paris (or default)"
echo ""
echo "4. Contract Name: BurnMintERC677"
echo ""
echo "5. For the source code, run this command to get flattened version:"
echo "   forge flatten src/tokens/BurnMintERC677.sol > flattened.sol"
echo "   Then copy the contents of flattened.sol"
echo ""
echo "6. Constructor Arguments (ABI-encoded):"
echo "   $CONSTRUCTOR_ARGS"
echo ""
echo "7. Complete the CAPTCHA and submit"
echo ""
echo "Your API Key (if needed): $ARBISCAN_API_KEY"
echo ""
echo "=========================================="