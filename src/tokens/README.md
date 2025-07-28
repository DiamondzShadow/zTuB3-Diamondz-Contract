# BurnMintERC677 Token

A custom ERC677 token implementation with burn and mint capabilities, designed for cross-chain transfers using Chainlink CCIP.

## Features

### Core Token Features
- **ERC20 Standard**: Full ERC20 compatibility
- **ERC677 Extension**: Includes `transferAndCall` for contract interactions
- **5 Billion Supply**: Initial supply of 5,000,000,000 tokens (18 decimals)
- **Burn/Mint Mechanism**: Essential for CCIP cross-chain transfers

### Access Control
- **Owner Role**: Can manage minters/burners and adjust max supply
- **Minter Role**: Can mint new tokens up to the max supply limit
- **Burner Role**: Can burn tokens from their own balance or others (with approval)

### Security Features
- **Max Supply Cap**: Prevents unlimited minting
- **Role-based Access**: Granular control over mint/burn permissions
- **ERC165 Support**: Interface detection for better composability

## CCIP Compatibility

The token is designed to work seamlessly with Chainlink's Cross-Chain Token (CCT) system:

1. **Burn on Source Chain**: When transferring cross-chain, tokens are burned on the source
2. **Mint on Destination**: Equivalent tokens are minted on the destination chain
3. **Role Management**: CCIP pools need minter/burner roles on respective chains

## Key Functions

### Token Operations
```solidity
// Transfer tokens and call recipient contract
transferAndCall(address to, uint256 amount, bytes data)

// Mint new tokens (minter only)
mint(address account, uint256 amount)

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
```

## Usage Example

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

## Testing

Run the comprehensive test suite:
```bash
forge test
```

## Security Considerations

1. **Initial Roles**: The deployer gets initial minter/burner roles - transfer these carefully
2. **Max Supply**: Set appropriate limits to prevent inflation
3. **CCIP Integration**: Only grant roles to verified CCIP pool contracts
4. **Owner Privileges**: Consider using a multisig for the owner role