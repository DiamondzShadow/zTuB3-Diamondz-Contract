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

1. **Set Environment Variables**:
   ```bash
   export TOKEN_NAME="Diamondz Shadow Game + Movies"
   export TOKEN_SYMBOL="SDM"
   export INITIAL_ACCOUNT="YOUR_WALLET_ADDRESS_HERE"
   export PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"
   export RPC_URL="https://hardworking-greatest-road.diamondz-zslab.quiknode.pro/"
   ```

2. **Deploy the Contract**:
   ```bash
   forge script script/DeployBurnMintERC677.s.sol:DeployBurnMintERC677 \
     --rpc-url $RPC_URL \
     --private-key $PRIVATE_KEY \
     --broadcast
   ```

3. **Or Use the Deployment Script**:
   ```bash
   # Edit the script to add your wallet address and private key
   nano deploy_sdm_token.sh
   
   # Run the deployment
   ./deploy_sdm_token.sh
   ```

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