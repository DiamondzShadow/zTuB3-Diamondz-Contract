# ✅ READY TO VERIFY - BurnMintERC677 Token

## Quick Verification Link
**[Click Here to Verify Now](https://arbiscan.io/verifyContract?a=0x602b869eEf1C9F0487F31776bad8Af3C4A173394)**

## Copy-Paste Information

### 1. Basic Settings
```
Contract Address: 0x602b869eEf1C9F0487F31776bad8Af3C4A173394
Compiler Type: Solidity (Single file)
Compiler Version: v0.8.19+commit.7dd6d404
Open Source License Type: 3
```

### 2. Optimization Settings ⚠️ CRITICAL
```
Optimization: Yes
Runs: 10000
EVM Version: paris
```
**⚠️ IMPORTANT: Use 10000 runs, NOT 200!** This is from your foundry.toml configuration.

### 3. Contract Name
```
BurnMintERC677
```

### 4. Source Code
Run this command in your original deployment directory:
```bash
cd ~/zTuB3-Diamondz-Contract
forge flatten src/tokens/BurnMintERC677.sol > flattened.sol
cat flattened.sol
```
Then copy the entire output and paste it in the source code field.

### 5. Constructor Arguments (ABI-encoded)
```
000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000018b2b2ce7d05bfe0883ff874ba0c536a89d07363000000000000000000000000000000000000000000000000000000000000001d4469616d6f6e647a20536861646f772047616d65202b204d6f766965730000000000000000000000000000000000000000000000000000000000000000000003534d0000000000000000000000000000000000000000000000000000000000
```

### 6. Your API Key
```
IGMMW2DMUS3QIEMIXHA42Q9IZP47X5M8PU
```

## Verification Checklist
- [ ] Contract Address: `0x602b869eEf1C9F0487F31776bad8Af3C4A173394`
- [ ] Compiler: `v0.8.19+commit.7dd6d404`
- [ ] Optimization: `Yes`
- [ ] Runs: `10000` (NOT 200!)
- [ ] Contract Name: `BurnMintERC677`
- [ ] Source: Flattened from your deployment directory
- [ ] Constructor Args: Provided above (no 0x prefix)

## Why Previous Attempts Failed
1. **Optimizer Runs**: Your foundry.toml uses 10000 runs, not the default 200
2. **API Key Issue**: Forge has issues with the Arbiscan API key validation
3. **Source Code**: Must be the exact version from your deployment directory

## Deployment Details (Confirmed)
- **Deployed From**: `~/zTuB3-Diamondz-Contract`
- **Deployment Script**: `deploy_sdm_token.sh`
- **Token Name**: "Diamondz Shadow Game + Movies"
- **Token Symbol**: "SDM"
- **Initial Supply**: 4,000,000,000 tokens
- **Initial Recipient**: `0x18b2b2ce7d05bfe0883ff874ba0c536a89d07363`
- **Deployer/Owner**: `0xC5D133296E17BA25DF0409a6C31607bf3B78e3e3`

## Success Confirmation
After verification, you'll see:
- ✅ "Contract Source Code Verified"
- The contract page will show the source code
- URL: https://arbiscan.io/address/0x602b869eEf1C9F0487F31776bad8Af3C4A173394#code

## If It Still Fails
The only remaining issue could be:
1. The source code has been modified since deployment
2. Different Solidity version was actually used
3. Different EVM version setting

Try these alternatives:
- EVM Version: `default` instead of `paris`
- Compiler: `v0.8.20+commit.a1b79de6` or `v0.8.18+commit.87f61d96`

## Command to Run on Your Server
```bash
cd ~/zTuB3-Diamondz-Contract
forge flatten src/tokens/BurnMintERC677.sol > flattened.sol
# Then copy flattened.sol content to Arbiscan
```

---

**You have everything needed to verify the contract successfully!** The key is using **10000 optimizer runs** as configured in your foundry.toml.