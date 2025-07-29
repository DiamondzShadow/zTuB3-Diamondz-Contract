# BurnMintERC677 Token Deployment Instructions

## Token Configuration
- **Name**: Configurable (e.g., "Diamondz Shadow Game + Movies")
- **Symbol**: Configurable (e.g., "SDM")
- **Initial Supply**: 4,000,000,000 (4 billion) tokens
- **Maximum Supply**: 5,000,000,000 (5 billion) tokens
- **Decimals**: 18
- **Features**: ERC677, CCIP Compatible, Gamification Events

## Key Features Added
1. **Gamification Events**: TokensMinted, MintMilestone, CrossChainMint
2. **Analytics Tracking**: Total minted per address, total mint events
3. **CCIP Enhanced**: Special mint function with cross-chain metadata
4. **Milestone System**: Automatic events every 100M tokens minted

## Deployment Steps

### 1. Environment Setup

Create your .env file:
```bash
cp .env.example .env
```

Edit .env file with your values:
```env
# Token Configuration
TOKEN_NAME="Your Token Name"
TOKEN_SYMBOL="YOUR_SYMBOL"
INITIAL_ACCOUNT=0xYourWalletAddress

# Deployment Configuration
PRIVATE_KEY=0xYourPrivateKey
RPC_URL=https://your-rpc-endpoint.com

# Optional: For contract verification
ETHERSCAN_API_KEY=your-etherscan-api-key
```

### 2. Deploy the Token

Using the deployment script:
```bash
./deploy_sdm_token.sh
```

Or using Forge directly:
```bash
forge script script/DeployBurnMintERC677.s.sol:DeployBurnMintERC677 \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify
```

### 3. Post-Deployment Setup

#### Set Up Event Monitoring
```javascript
// Example: Monitor mint events with ethers.js
const filter = token.filters.TokensMinted();
token.on(filter, (minter, recipient, amount, totalSupply, timestamp) => {
    console.log(`Mint detected: ${amount} tokens to ${recipient}`);
    // Update your analytics dashboard
    // Check for gaming opportunities
});

// Monitor milestones
token.on("MintMilestone", (recipient, totalMinted, milestone) => {
    console.log(`Milestone reached: ${recipient} has ${totalMinted} tokens`);
    // Trigger rewards or NFT minting
});
```

#### Configure CCIP (if using cross-chain)
```solidity
// On source chain - grant burn role
token.grantBurnRole(CCIP_POOL_ADDRESS);

// On destination chain - grant mint role
token.grantMintRole(CCIP_POOL_ADDRESS);
```

## Important Security Steps

1. **Transfer Ownership** (if using multisig):
   ```solidity
   token.transferOwnership(MULTISIG_ADDRESS);
   ```

2. **Review Initial Roles**:
   ```solidity
   // Check current minters and burners
   address[] memory minters = token.getMinters();
   address[] memory burners = token.getBurners();
   
   // Remove deployer if not needed
   token.revokeMintRole(DEPLOYER_ADDRESS);
   token.revokeBurnRole(DEPLOYER_ADDRESS);
   ```

3. **Set Up Monitoring**:
   - Monitor unusual mint patterns
   - Track milestone gaming attempts
   - Watch for max supply approaches
   - Alert on role changes

## Analytics Integration

### For Artemis or Similar Platforms
The enhanced events provide rich data:
- `TokensMinted`: Track all mints with timestamp and supply
- `MintMilestone`: Identify power users and whales
- `CrossChainMint`: Monitor cross-chain flows

### Example Analytics Query
```sql
-- Find top minters in last 24h
SELECT 
    recipient,
    SUM(amount) as total_minted,
    COUNT(*) as mint_count
FROM token_minted_events
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY recipient
ORDER BY total_minted DESC
LIMIT 10;
```

## Testing Your Deployment

1. **Verify Initial State**:
   ```javascript
   console.log("Total Supply:", await token.totalSupply());
   console.log("Max Supply:", await token.maxSupply());
   console.log("Owner:", await token.owner());
   ```

2. **Test Minting** (if you have minter role):
   ```javascript
   await token.mint(testAddress, ethers.parseEther("1000"));
   ```

3. **Check Gamification Stats**:
   ```javascript
   const totalMinted = await token.totalMintedTo(address);
   const mintEvents = await token.totalMintEvents();
   console.log(`Address has been minted ${totalMinted} tokens`);
   console.log(`Total mint events: ${mintEvents}`);
   ```

## Troubleshooting

- **"InvalidMinter" error**: Ensure the calling address has minter role
- **"MaxSupplyExceeded" error**: Check current supply vs max supply
- **Events not showing**: Ensure your RPC supports event logs
- **CCIP issues**: Verify pool addresses and role assignments

## Next Steps

1. Set up a monitoring dashboard for TokensMinted events
2. Create a leaderboard using totalMintedTo() data
3. Design reward mechanics for milestone achievements
4. Integrate with CCIP for cross-chain functionality
5. Consider implementing a frontend for gamification features