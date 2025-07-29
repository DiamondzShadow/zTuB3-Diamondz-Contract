# BurnMintERC677 Token

A custom ERC677 token implementation with burn and mint capabilities, designed for cross-chain transfers using Chainlink CCIP. Enhanced with gamification and analytics features for tracking mint events and user milestones.

## Features

### Core Token Features
- **ERC20 Standard**: Full ERC20 compatibility
- **ERC677 Extension**: Includes `transferAndCall` for contract interactions
- **4 Billion Initial Supply**: 4,000,000,000 tokens with 5 billion max supply cap (18 decimals)
- **Burn/Mint Mechanism**: Essential for CCIP cross-chain transfers
- **Gamification Events**: Rich event emissions for analytics and reward systems

### Access Control
- **Owner Role**: Can manage minters/burners and adjust max supply
- **Minter Role**: Can mint new tokens up to the max supply limit
- **Burner Role**: Can burn tokens from their own balance or others (with approval)

### Security Features
- **Max Supply Cap**: Prevents unlimited minting (5 billion tokens)
- **Role-based Access**: Granular control over mint/burn permissions
- **ERC165 Support**: Interface detection for better composability

### Gamification & Analytics Features
- **Mint Tracking**: Tracks total minted per address and global mint count
- **Milestone Events**: Automatic milestone notifications (every 100M tokens)
- **Cross-Chain Mint Events**: Special events for CCIP transfers with metadata
- **Rich Event Data**: Detailed information for analytics platforms like Artemis

## CCIP Compatibility

The token is designed to work seamlessly with Chainlink's Cross-Chain Token (CCT) system:

1. **Burn on Source Chain**: When transferring cross-chain, tokens are burned on the source
2. **Mint on Destination**: Equivalent tokens are minted on the destination chain
3. **Role Management**: CCIP pools need minter/burner roles on respective chains
4. **Enhanced Tracking**: Special cross-chain mint events for better visibility

## Key Functions

### Token Operations
```solidity
// Transfer tokens and call recipient contract
transferAndCall(address to, uint256 amount, bytes data)

// Mint new tokens (minter only)
mint(address account, uint256 amount)

// Mint with CCIP metadata (minter only)
mintWithCCIPData(address account, uint256 amount, string sourceChain, bytes32 ccipMessageId)

// Burn tokens from caller (burner only)
burn(uint256 amount)

// Burn tokens from another account (burner only, requires approval)
burnFrom(address account, uint256 amount)
```

### Admin Functions
```solidity
// Grant/revoke minter role
grantMintRole(address minter)
revokeMintRole(address minter)

// Grant/revoke burner role
grantBurnRole(address burner)
revokeBurnRole(address burner)

// Update maximum supply
setMaxSupply(uint256 newMaxSupply)
```

### View Functions
```solidity
// Check roles
isMinter(address) → bool
isBurner(address) → bool

// Get role lists
getMinters() → address[]
getBurners() → address[]

// Supply info
totalSupply() → uint256
maxSupply() → uint256

// Gamification stats
totalMintedTo(address) → uint256
totalMintEvents() → uint256
```

## Events

### Standard Events
- `Transfer(address indexed from, address indexed to, uint256 value)`
- `Transfer(address indexed from, address indexed to, uint256 value, bytes data)` (ERC677)
- `MinterAdded(address indexed minter)`
- `MinterRemoved(address indexed minter)`
- `BurnerAdded(address indexed burner)`
- `BurnerRemoved(address indexed burner)`

### Gamification Events
```solidity
// Detailed mint information
event TokensMinted(
    address indexed minter,
    address indexed recipient,
    uint256 amount,
    uint256 totalSupply,
    uint256 timestamp
);

// Milestone achievements
event MintMilestone(
    address indexed recipient,
    uint256 totalMinted,
    uint256 milestoneReached
);

// Cross-chain mint tracking
event CrossChainMint(
    address indexed recipient,
    uint256 amount,
    string sourceChain,
    bytes32 ccipMessageId
);
```

## Usage Examples

### Basic Usage
```solidity
// Deploy token
BurnMintERC677 token = new BurnMintERC677(
    "MyToken",
    "MTK",
    initialRecipient
);

// Grant CCIP pool permissions
token.grantMintRole(ccipPoolAddress);
token.grantBurnRole(ccipPoolAddress);

// Use transferAndCall for contract interactions
bytes memory data = abi.encode(userId, action);
token.transferAndCall(contractAddress, amount, data);
```

### Gamification Integration
```javascript
// Listen for mint events
token.on("TokensMinted", (minter, recipient, amount, totalSupply, timestamp) => {
    console.log(`New mint: ${amount} tokens to ${recipient}`);
    updateAnalyticsDashboard(recipient, amount);
});

// Track milestones
token.on("MintMilestone", (recipient, totalMinted, milestone) => {
    console.log(`${recipient} reached ${milestone} tokens!`);
    rewardUser(recipient, milestone);
});

// Monitor cross-chain activity
token.on("CrossChainMint", (recipient, amount, sourceChain, messageId) => {
    console.log(`Cross-chain mint from ${sourceChain}: ${amount} tokens`);
    trackCrossChainFlow(sourceChain, amount);
});
```

## Testing

Run the comprehensive test suite:
```bash
# Run all tests
forge test

# Run with gas reporting
forge test --gas-report

# Run gamification tests specifically
forge test --match-path test/BurnMintERC677Gamification.t.sol -vv
```

## Security Considerations

1. **Initial Roles**: The deployer gets initial minter/burner roles - transfer these carefully
2. **Max Supply**: Set appropriate limits to prevent inflation (default: 5 billion)
3. **CCIP Integration**: Only grant roles to verified CCIP pool contracts
4. **Owner Privileges**: Consider using a multisig for the owner role
5. **Event Monitoring**: Set up monitoring for unusual mint patterns or milestone gaming
6. **Rate Limiting**: Consider implementing rate limits for gamification rewards