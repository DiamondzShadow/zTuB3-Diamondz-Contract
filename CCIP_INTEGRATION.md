# BurnMintERC677 - Chainlink CCIP Integration Guide

This guide explains how to use the BurnMintERC677 token with Chainlink's Cross-Chain Token (CCT) system.

## Overview

The BurnMintERC677 token is designed to be fully compatible with Chainlink CCIP for cross-chain transfers. It implements:

- **ERC677** - Standard ERC20 with `transferAndCall` functionality
- **Burn/Mint mechanism** - Required for CCIP cross-chain transfers
- **Role-based access control** - For managing minters and burners
- **4 billion token initial supply** - With configurable max supply (5 billion default)
- **Gamification events** - Enhanced tracking for cross-chain mints

## Key Features for CCIP

### 1. Burn and Mint Functions
- `mint(address account, uint256 amount)` - Mints new tokens (restricted to minters)
- `burn(uint256 amount)` - Burns tokens from caller (restricted to burners)
- `burnFrom(address account, uint256 amount)` - Burns tokens from another account with approval

### 2. Role Management
- `grantMintRole(address minter)` - Grants minting permission (owner only)
- `grantBurnRole(address burner)` - Grants burning permission (owner only)
- `revokeMintRole(address minter)` - Revokes minting permission
- `revokeBurnRole(address burner)` - Revokes burning permission

### 3. ERC677 TransferAndCall
- `transferAndCall(address to, uint256 amount, bytes data)` - Transfers tokens and calls receiver

### 4. Enhanced Cross-Chain Tracking
- `mintWithCCIPData(address account, uint256 amount, string sourceChain, bytes32 ccipMessageId)` - Special mint function for CCIP with metadata
- Emits `CrossChainMint` event for better cross-chain visibility

## CCIP Registration Steps

After deploying your token, follow these steps to register it with Chainlink CCIP:

### 1. Deploy Token on Source and Destination Chains

```bash
# Set environment variables
export TOKEN_NAME="MyToken"
export TOKEN_SYMBOL="MTK"
export INITIAL_ACCOUNT="0xYourAddress"
export PRIVATE_KEY="0xYourPrivateKey"

# Deploy on source chain
forge script script/DeployBurnMintERC677.s.sol:DeployBurnMintERC677 --rpc-url $SOURCE_RPC_URL --broadcast --verify

# Deploy on destination chain
forge script script/DeployBurnMintERC677.s.sol:DeployBurnMintERC677 --rpc-url $DEST_RPC_URL --broadcast --verify
```

### 2. Grant CCIP Contracts Mint/Burn Roles

After deployment, you need to grant the CCIP contracts the ability to mint and burn tokens:

```solidity
// On destination chain - grant mint role to CCIP Token Pool
token.grantMintRole(CCIP_TOKEN_POOL_ADDRESS);

// On source chain - grant burn role to CCIP Token Pool
token.grantBurnRole(CCIP_TOKEN_POOL_ADDRESS);
```

### 3. Register with CCIP

1. Go to the [Chainlink CCIP Token Registration Portal](https://docs.chain.link/ccip)
2. Connect your wallet as the token owner
3. Select your token on both source and destination chains
4. Configure the token pool settings
5. Submit for review

### 4. Token Pool Configuration

The CCIP system will create token pools that handle the burn/mint operations:
- **Source Chain Pool**: Burns tokens when sending cross-chain
- **Destination Chain Pool**: Mints tokens when receiving cross-chain

## Using Gamification Features with CCIP

### Track Cross-Chain Mints

When CCIP mints tokens on the destination chain, you can use the enhanced mint function:

```solidity
// In your CCIP integration contract
function handleCCIPMint(
    address recipient,
    uint256 amount,
    string memory sourceChain,
    bytes32 messageId
) external onlyCCIPPool {
    // Use the enhanced mint function
    token.mintWithCCIPData(recipient, amount, sourceChain, messageId);
}
```

### Monitor Cross-Chain Activity

```javascript
// Listen for cross-chain mints
token.on("CrossChainMint", (recipient, amount, sourceChain, messageId) => {
    console.log(`Cross-chain mint from ${sourceChain}: ${amount} tokens`);
    
    // Update cross-chain analytics
    updateCrossChainStats(sourceChain, amount);
    
    // Track CCIP message
    trackCCIPMessage(messageId);
});

// Monitor all mints including cross-chain
token.on("TokensMinted", (minter, recipient, amount, totalSupply, timestamp) => {
    if (minter === CCIP_POOL_ADDRESS) {
        console.log("CCIP mint detected");
    }
});
```

### Analytics for Cross-Chain Flows

```sql
-- Query cross-chain mint volumes by source chain
SELECT 
    sourceChain,
    COUNT(*) as transfer_count,
    SUM(amount) as total_volume
FROM cross_chain_mint_events
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY sourceChain
ORDER BY total_volume DESC;
```

## Testing the Integration

Run the test suite to ensure your token works correctly:

```bash
# Run all tests
forge test

# Run specific test
forge test --match-test test_BurnMintFunctionality -vvv

# Run with gas reporting
forge test --gas-report
```

## Security Considerations

1. **Role Management**: Only trusted addresses should have mint/burn roles
2. **Max Supply**: Set an appropriate max supply to prevent unlimited minting
3. **Access Control**: The owner account has significant privileges - use a multisig
4. **CCIP Pool Addresses**: Verify the official CCIP pool addresses before granting roles
5. **Event Monitoring**: Set up alerts for unusual cross-chain mint patterns

## Example Integration Script

```solidity
// Example script to set up CCIP roles on DESTINATION chain
contract SetupCCIPRolesDestination is Script {
    function run() external {
        address tokenAddress = 0x...; // Your deployed token
        address ccipPoolAddress = 0x...; // Official CCIP pool
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        BurnMintERC677 token = BurnMintERC677(tokenAddress);
        
        // On destination chain - grant ONLY mint role
        token.grantMintRole(ccipPoolAddress);
        
        vm.stopBroadcast();
    }
}

// Example script to set up CCIP roles on SOURCE chain
contract SetupCCIPRolesSource is Script {
    function run() external {
        address tokenAddress = 0x...; // Your deployed token
        address ccipPoolAddress = 0x...; // Official CCIP pool
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        BurnMintERC677 token = BurnMintERC677(tokenAddress);
        
        // On source chain - grant ONLY burn role
        token.grantBurnRole(ccipPoolAddress);
        
        vm.stopBroadcast();
    }
}
```

## Supported Networks

Chainlink CCIP currently supports these networks:
- Ethereum Mainnet
- Polygon
- Avalanche
- Arbitrum
- Optimism
- BNB Chain
- Base

Check the [official documentation](https://docs.chain.link/ccip/supported-networks) for the latest list.

## Resources

- [Chainlink CCIP Documentation](https://docs.chain.link/ccip)
- [Cross-Chain Token Overview](https://docs.chain.link/ccip/concepts/cross-chain-token/overview)
- [Token Registration Guide](https://docs.chain.link/ccip/concepts/cross-chain-token/evm/registration-administration)
- [CCIP Best Practices](https://docs.chain.link/ccip/best-practices)

## Contract Addresses

Once deployed, update this section with your contract addresses:

| Network | Token Address | CCIP Pool Address |
|---------|--------------|-------------------|
| Ethereum | 0x... | 0x... |
| Polygon | 0x... | 0x... |
| Avalanche | 0x... | 0x... |