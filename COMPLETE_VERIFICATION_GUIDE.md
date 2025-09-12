# Complete Contract Verification Guide for SDM Token

## Contract Information
- **Address**: `0x602b869eEf1C9F0487F31776bad8Af3C4A173394`
- **Network**: Arbitrum
- **Deployment TX**: `0x1061de9e96b65cc62fabc748d972fefcf7cfc7fc9c518464855ac9744ef7d85d`
- **Deployer**: `0xC5D133296E17BA25DF0409a6C31607bf3B78e3e3`
- **Initial Mint Recipient**: `0x18b2b2ce7d05bfe0883ff874ba0c536a89d07363`

## Verification Status
❌ **NOT VERIFIED** - The contract needs to be verified on Arbiscan

## Analysis Results
Based on bytecode analysis:
- Contract size: 7,633 bytes
- Contains: mint, burn, transferAndCall functions
- Likely contract: Modified BurnMintERC677 or earlier version
- Compiler version: Likely 0.8.19 or 0.8.20

## Verification Options

### Option 1: Manual Verification on Arbiscan

1. **Go to**: https://arbiscan.io/verifyContract?a=0x602b869eEf1C9F0487F31776bad8Af3C4A173394

2. **Enter these details**:
   ```
   Contract Address: 0x602b869eEf1C9F0487F31776bad8Af3C4A173394
   Compiler Type: Solidity (Single file)
   Compiler Version: v0.8.19+commit.7dd6d404
   Open Source License Type: 3 (MIT)
   ```

3. **Optimization Settings**:
   ```
   Optimization: Yes
   Runs: 200
   EVM Version: paris (or default)
   ```

4. **Contract Code**:
   - Use the flattened contract from `/workspace/BurnMintERC677_flattened.sol`
   - OR flatten it yourself: `forge flatten src/tokens/BurnMintERC677.sol`

5. **Constructor Arguments** (ABI-encoded):
   ```
   000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000018b2b2ce7d05bfe0883ff874ba0c536a89d07363000000000000000000000000000000000000000000000000000000000000001d4469616d6f6e647a20536861646f772047616d65202b204d6f766965730000000000000000000000000000000000000000000000000000000000000000000003534d0000000000000000000000000000000000000000000000000000000000
   ```

6. **Contract Name**: `BurnMintERC677`

### Option 2: Using Forge (Command Line)

```bash
# First, ensure you have the correct environment variables
export ARBISCAN_API_KEY="IGMMW2DMUS3QIEMIXHA42Q9IZP47X5M8PU"

# Try verification with different compiler versions
forge verify-contract 0x602b869eEf1C9F0487F31776bad8Af3C4A173394 \
  src/tokens/BurnMintERC677.sol:BurnMintERC677 \
  --chain arbitrum \
  --etherscan-api-key $ARBISCAN_API_KEY \
  --compiler-version v0.8.19+commit.7dd6d404 \
  --constructor-args 0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000018b2b2ce7d05bfe0883ff874ba0c536a89d07363000000000000000000000000000000000000000000000000000000000000001d4469616d6f6e647a20536861646f772047616d65202b204d6f766965730000000000000000000000000000000000000000000000000000000000000000000003534d0000000000000000000000000000000000000000000000000000000000 \
  --num-of-optimizations 200
```

### Option 3: Alternative Contract Versions

If the BurnMintERC677 doesn't match, try these alternatives:

1. **Simpler ERC20 version** (if you have an earlier version):
   ```solidity
   // Check if you have a simpler version without all the CCIP features
   // The deployed bytecode is smaller than the current BurnMintERC677
   ```

2. **Different optimization settings**:
   - Try with optimization OFF
   - Try with different runs (1, 999999)
   - Try different EVM versions (london, berlin)

### Option 4: Using Hardhat (if you have a Hardhat setup)

```javascript
// hardhat.config.js
module.exports = {
  etherscan: {
    apiKey: {
      arbitrumOne: "IGMMW2DMUS3QIEMIXHA42Q9IZP47X5M8PU"
    }
  },
  networks: {
    arbitrum: {
      url: "https://nameless-solemn-cherry.arbitrum-mainnet.quiknode.pro/a30fa1bc3689f3c94015f038c6bb30c0a3826555/"
    }
  }
};

// Run:
// npx hardhat verify --network arbitrum 0x602b869eEf1C9F0487F31776bad8Af3C4A173394 "Diamondz Shadow Game + Movies" "SDM" "0x18b2b2ce7d05bfe0883ff874ba0c536a89d07363"
```

## Troubleshooting

### Common Issues:

1. **"Invalid constructor arguments"**
   - Double-check the address that received the initial mint
   - Ensure no "0x" prefix in the constructor args
   - Try encoding with: `cast abi-encode "constructor(string,string,address)" "Diamondz Shadow Game + Movies" "SDM" "0x18b2b2ce7d05bfe0883ff874ba0c536a89d07363"`

2. **"Bytecode does not match"**
   - The deployed contract might be a different version
   - Try different compiler versions (0.8.18, 0.8.19, 0.8.20)
   - Try different optimization settings

3. **"Already verified"**
   - Good news! Check: https://arbiscan.io/address/0x602b869eEf1C9F0487F31776bad8Af3C4A173394#code

## Your Resources

- **API Key**: `IGMMW2DMUS3QIEMIXHA42Q9IZP47X5M8PU`
- **QuickNode RPC**: `https://nameless-solemn-cherry.arbitrum-mainnet.quiknode.pro/a30fa1bc3689f3c94015f038c6bb30c0a3826555/`
- **Contract Source**: `/workspace/src/tokens/BurnMintERC677.sol`
- **Flattened Source**: `/workspace/BurnMintERC677_flattened.sol`

## Next Steps

1. Try manual verification first (Option 1) - it's most reliable
2. If that fails, check if you have the EXACT source code that was deployed
3. The bytecode size difference suggests the deployed contract might be:
   - An earlier version of BurnMintERC677
   - Compiled with different settings
   - A modified version

## Important Note

The deployed contract (7,633 bytes) is smaller than the current BurnMintERC677 (~9,124 bytes), which suggests:
- Some features might have been added after deployment
- Different compiler optimizations were used
- Or it's a different contract version

You'll need the EXACT source code that was used for deployment to successfully verify.