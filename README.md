````markdown
# BurnMintERC677 Token

> An ERC677 token with burn and mint capabilities, designed for cross-chain compatibility with Chainlink CCIP and enhanced gamification features.

## Table of Contents

- [Overview](#overview)  
- [Features](#features)  
- [Prerequisites](#prerequisites)  
- [Getting Started](#getting-started)  
  - [Clone & Install](#clone--install)  
  - [Configure Environment](#configure-environment)  
  - [Compile & Test](#compile--test)  
- [EVM Deployment](#evm-deployment)  
  - [Dry Run](#dry-run)  
  - [Live Deploy](#live-deploy)  
  - [Verify & ABI](#verify--abi)
- [Solana Deployment](#solana-deployment)
  - [Prerequisites](#solana-prerequisites)
  - [Quick Deploy](#quick-deploy)
  - [Detailed Setup](#detailed-setup)  
- [Usage Examples](#usage-examples)  
  - [Ethers.js](#ethersjs)  
  - [CLI](#cli)  
  - [Web3.js](#web3js)  
- [Gamification Features](#gamification-features)
- [CCIP Integration](#ccip-integration)
- [Contributing](#contributing)  
- [License](#license)

---

## Overview

`BurnMintERC677` is an ERC20 token with ERC677 extension that's optimized for:

- **Cross-chain transfers** via Chainlink CCIP  
- **Role-based minting and burning** for flexible supply management  
- **Gamification features** with milestone tracking and rich event emissions  
- **Analytics-ready** with comprehensive event data for platforms like Artemis  
- **4 billion initial supply** (4,000,000,000 tokens) with a **5 billion max supply cap** (5,000,000,000 tokens)  

---

## Features

- ✅ ERC677 transferAndCall functionality  
- 🔥 Burnable with role-based access control  
- 🪙 Mintable with max supply protection  
- 🎮 Built-in gamification with milestone tracking  
- 🌉 CCIP-ready for cross-chain transfers  
- 📊 Rich event emissions for analytics  
- 🏦 Owner-controlled role management  
- 🛡️ Maximum supply guardrail (5,000,000,000 tokens)  

---

## Prerequisites

### 1. Rust & Cargo

**Linux/macOS:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Windows PowerShell:**
```powershell
irm https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
.\rustup-init.exe -y
Remove-Item .\rustup-init.exe
```

After installation, restart your terminal and verify with `rustc --version`.

### 2. Foundry (forge & cast)

**Linux/macOS:**
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

**Windows PowerShell:**
```powershell
# Install WSL2 first if not already installed
wsl --install

# Then run inside WSL2
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

This will install forge, cast, anvil, and chisel. Verify with `forge --version`.

### 3. Git

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install git
```

**Linux (Fedora/RHEL):**
```bash
sudo dnf install git
```

**macOS:**
```bash
# Install Homebrew first if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install Git
brew install git
```

**Windows PowerShell:**
```powershell
# Using winget (Windows Package Manager)
winget install --id Git.Git -e --source winget

# Or using Chocolatey if installed
choco install git -y
```

Verify installation with `git --version`.

### 4. Node.js + npm

**Linux:**
```bash
# Using Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts
nvm use --lts
```

**macOS:**
```bash
# Using Homebrew
brew install node

# Or using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts
nvm use --lts
```

**Windows PowerShell:**
```powershell
# Using winget
winget install OpenJS.NodeJS.LTS

# Or using Chocolatey
choco install nodejs-lts -y

# Or using nvm for Windows (check https://github.com/coreybutler/nvm-windows/releases for latest)
irm https://github.com/coreybutler/nvm-windows/releases/download/1.1.12/nvm-setup.exe -OutFile nvm-setup.exe
Start-Process nvm-setup.exe -Wait
nvm install lts
nvm use lts
```

Verify installation with `node --version` and `npm --version`.  

---

## Getting Started

### Clone & Install

```bash
git clone git@github.com:DiamondzShadow/zTuB3-Diamondz-Contract.git
cd zTuB3-Diamondz-Contract
forge install OpenZeppelin/openzeppelin-contracts
```

### Configure Environment

Create a local `.env` (never committed):

```ini
# Network RPC URL
RPC_URL="https://your-rpc-url-here"

# Deployment private key
PRIVATE_KEY="0xYourPrivateKeyHere"

# Token configuration
TOKEN_NAME="YourTokenName"
TOKEN_SYMBOL="YTN"
INITIAL_ACCOUNT="0xAddressThatReceivesInitialSupply"

# Deployed token address (fill in after deployment)
#TOKEN_ADDRESS="0x..."
```

Load it:

```bash
source .env
```

### Compile & Test

```bash
forge clean
forge build
forge test
```

---

## EVM Deployment

### Dry Run

```bash
forge script script/DeployBurnMintERC677.s.sol:DeployBurnMintERC677 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

This simulates gas costs without sending transactions.

### Live Deploy

```bash
forge script script/DeployBurnMintERC677.s.sol:DeployBurnMintERC677 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

The deployment will output the token contract address.

### Verify & ABI

```bash
export TOKEN_ADDRESS=<YourTokenAddress>

# Verify basic functionality
cast call $TOKEN_ADDRESS "name()(string)" --rpc-url $RPC_URL
cast call $TOKEN_ADDRESS "symbol()(string)" --rpc-url $RPC_URL
cast call $TOKEN_ADDRESS "totalSupply()(uint256)" --rpc-url $RPC_URL

# Extract ABI for frontend/SDK
forge inspect src/tokens/BurnMintERC677.sol:BurnMintERC677 abi > abi.json

git add abi.json
git commit -m "Add BurnMintERC677 ABI post-deploy"
git push
```

---

## Solana Deployment

This project includes a complete Solana token implementation that mirrors the EVM version for cross-chain CCIP integration.

### Solana Prerequisites

Install additional tools for Solana development:

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor Framework
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest

# Install Yarn
npm install -g yarn
```

### Quick Deploy

```bash
# Navigate to Solana token directory
cd solana-token

# Install dependencies
yarn install

# Deploy to Solana devnet for testing
yarn deploy:devnet

# Or deploy to mainnet (after testing)
yarn deploy:mainnet

# Test interactions
yarn interact:devnet
```

### Detailed Setup

1. **Create Solana wallet** (if needed):
```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

2. **Configure for devnet**:
```bash
solana config set --url https://api.devnet.solana.com
export ANCHOR_WALLET=~/.config/solana/id.json

# Fund wallet for testing
solana airdrop 2 --url https://api.devnet.solana.com
```

3. **Build and deploy**:
```bash
cd solana-token
anchor build
anchor deploy
yarn deploy:devnet
```

4. **For mainnet deployment**:
```bash
solana config set --url https://api.mainnet-beta.solana.com
anchor config set --provider.cluster mainnet
anchor deploy
yarn deploy:mainnet
```

### Verification

After deployment:
- Check deployment info: `cat deployment-devnet.json`
- Verify on [Solana Explorer](https://explorer.solana.com)
- Test interactions: `yarn interact:devnet`

### Token Configuration

The Solana token exactly mirrors the EVM version:
- **Initial Supply**: 4 billion tokens
- **Max Supply**: 5 billion tokens  
- **Decimals**: 18
- **Features**: CCIP compatible, role-based access, milestone tracking

For complete Solana documentation, see:
- `solana-token/DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- `README_SOLANA.md` - Complete Solana documentation
- `SOLANA_DEPLOYMENT_SUMMARY.md` - Project overview

---

## Usage Examples

### Ethers.js

```javascript
import { ethers } from "ethers";
import abi from "./abi.json";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.TOKEN_ADDRESS, abi, signer);

async function main() {
  // Read token info
  console.log("Name:", await contract.name());
  console.log("Symbol:", await contract.symbol());
  console.log("Total Supply:", ethers.utils.formatEther(await contract.totalSupply()));
  
  // Transfer with callback (ERC677)
  const recipient = "0xRecipientAddress";
  const amount = ethers.utils.parseEther("100");
  const data = ethers.utils.defaultAbiCoder.encode(["string"], ["Hello"]);
  
  const tx = await contract.transferAndCall(recipient, amount, data);
  await tx.wait();
  
  // Check gamification data
  const totalMinted = await contract.totalMintedTo(recipient);
  console.log("Total minted to recipient:", ethers.utils.formatEther(totalMinted));
}

main().catch(console.error);
```

### CLI

Using cast (Foundry):

```bash
# Check token balance
cast call $TOKEN_ADDRESS "balanceOf(address)(uint256)" $YOUR_ADDRESS --rpc-url $RPC_URL

# Transfer tokens
cast send $TOKEN_ADDRESS "transfer(address,uint256)" $RECIPIENT_ADDRESS 1000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Mint tokens (owner has minter role by default)
cast send $TOKEN_ADDRESS "mint(address,uint256)" $RECIPIENT_ADDRESS 1000000000000000000 \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

### Web3.js

```javascript
const Web3 = require('web3');
const abi = require('./abi.json');

const web3 = new Web3(process.env.RPC_URL);
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

const contract = new web3.eth.Contract(abi, process.env.TOKEN_ADDRESS);

async function monitorEvents() {
  // Listen for milestone events
  contract.events.MintMilestone({
    fromBlock: 'latest'
  })
  .on('data', (event) => {
    console.log('Milestone reached!', {
      recipient: event.returnValues.recipient,
      totalMinted: web3.utils.fromWei(event.returnValues.totalMinted),
      milestone: event.returnValues.milestoneReached
    });
  });

  // Listen for cross-chain mints
  contract.events.CrossChainMint({
    fromBlock: 'latest'
  })
  .on('data', (event) => {
    console.log('Cross-chain mint detected!', {
      recipient: event.returnValues.recipient,
      amount: web3.utils.fromWei(event.returnValues.amount),
      sourceChain: event.returnValues.sourceChain
    });
  });
}

monitorEvents().catch(console.error);
```

---

## Gamification Features

The token includes built-in gamification features:

- **Milestone Tracking**: Automatic detection when addresses reach 100M token milestones
- **Mint Tracking**: Total minted amount per address tracked on-chain
- **Rich Events**: Comprehensive event data for analytics and achievements
- **Cross-chain Attribution**: Track mints from different chains via CCIP

See [GAMIFICATION_FEATURES.md](GAMIFICATION_FEATURES.md) for detailed documentation.

---

## CCIP Integration

The token is fully compatible with Chainlink CCIP for cross-chain transfers:

- Implements burn/mint mechanism for cross-chain transfers
- Enhanced minting function with CCIP metadata tracking
- Compatible with Chainlink's Cross-Chain Token (CCT) system

See [CCIP_INTEGRATION.md](CCIP_INTEGRATION.md) for integration guide.

---

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "Add amazing feature"`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).
