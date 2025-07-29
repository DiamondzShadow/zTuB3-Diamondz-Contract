# SDM Token Deployment Instructions

## Token Configuration
- **Name**: Diamondz Shadow Game + Movies
- **Symbol**: SDM
- **Initial Supply**: 4,000,000,000 (4 billion) tokens
- **Maximum Supply**: 5,000,000,000 (5 billion) tokens
- **Decimals**: 18

## Changes Made
1. Updated `INITIAL_SUPPLY` from 5 billion to 4 billion
2. Added `MAX_SUPPLY` constant set to 5 billion
3. Updated constructor to use `MAX_SUPPLY` for the supply cap

## Deployment Steps

1. **Create your .env file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit .env file** and replace the placeholder values:
   - `INITIAL_ACCOUNT`: Your wallet address that will receive the 4 billion initial tokens
   - `PRIVATE_KEY`: Your wallet's private key (keep this secure!)
   - `RPC_URL`: Already set to your QuickNode endpoint

3. **Run the deployment script**:
   ```bash
   ./deploy_sdm_token.sh
   ```

The script will:
- Validate that all required environment variables are set
- Check that placeholder values have been replaced
- Deploy the contract with proper error handling
- Optionally verify on Etherscan if `ETHERSCAN_API_KEY` is provided

## Important Notes
- The contract will mint 4 billion tokens to the `INITIAL_ACCOUNT` address
- The maximum supply is capped at 5 billion tokens
- Additional tokens (up to 1 billion more) can be minted by addresses with the minter role
- The contract owner can adjust the max supply if needed using `setMaxSupply()`
- Make sure you have enough native tokens (ETH/MATIC/etc) for gas fees

## After Deployment
- Save the deployed contract address
- Verify the contract on Etherscan if desired
- Grant minter/burner roles to necessary addresses
- Remove unnecessary minter/burner roles for security