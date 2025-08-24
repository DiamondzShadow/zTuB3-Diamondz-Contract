````markdown
# BurnMintSPL Token (Solana)

> An SPL token with burn and mint capabilities, designed for cross-chain compatibility with Chainlink CCIP and enhanced gamification features.

## Table of Contents

- [Overview](#overview)  
- [Features](#features)  
- [Prerequisites](#prerequisites)  
- [Getting Started](#getting-started)  
  - [Clone & Install](#clone--install)  
  - [Configure Environment](#configure-environment)  
  - [Compile & Test](#compile--test)  
- [Deployment](#deployment)  
  - [Dry Run](#dry-run)  
  - [Live Deploy](#live-deploy)  
  - [Verify & IDL](#verify--idl)  
- [Usage Examples](#usage-examples)  
  - [Web3.js (@solana/web3.js)](#web3js-solanaweb3js)  
  - [CLI](#cli)  
  - [Token Client (@solana/spl-token)](#token-client-solanaspl-token)  
- [Gamification Features](#gamification-features)
- [CCIP Integration](#ccip-integration)
- [Contributing](#contributing)  
- [License](#license)

---

## Overview

`BurnMintSPL` is an SPL token and optional Anchor program that's optimized for:

- **Cross-chain transfers** via Chainlink CCIP  
- **Role-based minting and burning** by delegating mint/burn authorities  
- **Gamification features** with milestone tracking and structured logs  
- **Analytics-ready** with program logs and on-chain accounts for tracking  
- **4 billion initial supply** with a 5 billion max supply cap (enforced by program logic)  

---

## Features

- ✅ SPL mint with delegated authorities  
- 🔥 Burnable with program-enforced access control  
- 🪙 Mintable with max supply protection  
- 🎮 Built-in gamification with milestone tracking  
- 🌉 CCIP-ready for cross-chain transfers  
- 📊 Structured program logs for analytics  
- 🏦 Owner-controlled authority management  
- 🛡️ Maximum supply guardrail (5B tokens)  

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
./rustup-init.exe -y
Remove-Item ./rustup-init.exe
```

After installation, restart your terminal and verify with `rustc --version`.

### 2. Solana CLI & Anchor

**Solana CLI (Linux/macOS):**
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
solana --version
```

**Anchor CLI:**
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest
avm use latest
anchor --version
```

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

# Or using nvm for Windows (check releases for latest)
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
# If using Anchor for the Solana program
anchor build
```

### Configure Environment

Create a local `.env` (never committed):

```ini
# Network RPC URL
RPC_URL="https://api.mainnet-beta.solana.com" # or your custom endpoint

# Payer keypair path
PAYER_KEYPAIR="~/.config/solana/id.json"

# Token configuration
MINT_ADDRESS="YourSPLMintAddress"
INITIAL_RECIPIENT="RecipientPubkey"

# Optional: Program (if using Anchor program for mint/burn logic)
#PROGRAM_ID="YourProgramId"
```

Load it:

```bash
source .env
solana config set --url $RPC_URL
solana config set --keypair $PAYER_KEYPAIR
```

### Compile & Test

```bash
# Localnet for dry runs
solana-test-validator --reset --limit-ledger-size 500 &

# Build and test (Anchor)
anchor build
anchor test
```

---

## Deployment

### Dry Run

```bash
# Deploy to localnet for simulation
anchor deploy --provider.cluster localnet
```

This simulates behavior without sending transactions to mainnet.

### Live Deploy

```bash
# Ensure your config points to the desired cluster
solana config get

# Deploy (Anchor)
anchor deploy

# Or, if not using Anchor, ensure your mint exists:
spl-token create-token                               # if you need to create a new mint
spl-token create-account $MINT_ADDRESS               # create ATA for payer
spl-token mint $MINT_ADDRESS 1000000000              # example mint (adjust decimals)
```

The deployment will output the program ID (if any) and you already have the mint address.

### Verify & IDL

```bash
export MINT_ADDRESS=<YourSPLMint>

# Verify mint info
spl-token account-info $MINT_ADDRESS | cat
spl-token supply $MINT_ADDRESS | cat

# If using Anchor, fetch IDL for frontend/SDK
anchor idl fetch <PROGRAM_ID> > idl.json

git add idl.json || true
git add -A
git commit -m "Add BurnMintSPL IDL post-deploy"
git push
```

---

## Usage Examples

### Web3.js (@solana/web3.js)

```javascript
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

const connection = new Connection(process.env.RPC_URL!, 'confirmed');
const payer = Keypair.fromSecretKey(require('fs').readFileSync(process.env.PAYER_KEYPAIR!, 'utf8'));
const mint = new PublicKey(process.env.MINT_ADDRESS!);

async function main() {
  const recipient = new PublicKey(process.env.INITIAL_RECIPIENT!);

  const fromAta = await getAssociatedTokenAddress(mint, payer.publicKey, false);
  const toAta = await getAssociatedTokenAddress(mint, recipient, true);

  // Build and send a transfer instruction (Token-2022 if using hooks)
  const ix = createTransferInstruction(fromAta, toAta, payer.publicKey, 100n, [], TOKEN_2022_PROGRAM_ID);
  const blockhash = await connection.getLatestBlockhash();
  const tx = new (await import('@solana/web3.js')).Transaction({ blockhash: blockhash.blockhash, lastValidBlockHeight: blockhash.lastValidBlockHeight, feePayer: payer.publicKey }).add(ix);
  tx.sign(payer);
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(sig, 'confirmed');

  console.log('Transfer signature:', sig);
}

main().catch(console.error);
```

### CLI

Using Solana and SPL Token CLI:

```bash
# Airdrop on devnet for testing
solana airdrop 2 --url https://api.devnet.solana.com

# Create ATA and check balance
spl-token create-account $MINT_ADDRESS
spl-token balance $MINT_ADDRESS | cat

# Transfer tokens
spl-token transfer $MINT_ADDRESS 100 <RECIPIENT_PUBKEY> --fund-recipient

# Mint tokens (requires mint authority)
spl-token mint $MINT_ADDRESS 1000 <RECIPIENT_PUBKEY>
```

### Token Client (@solana/spl-token)

```javascript
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getMint, getOrCreateAssociatedTokenAccount, mintTo, transfer, TOKEN_PROGRAM_ID } from '@solana/spl-token';

const connection = new Connection(process.env.RPC_URL!, 'confirmed');
const payer = Keypair.fromSecretKey(require('fs').readFileSync(process.env.PAYER_KEYPAIR!, 'utf8'));
const mint = new PublicKey(process.env.MINT_ADDRESS!);

async function monitorLogs() {
  const programId = new PublicKey(process.env.PROGRAM_ID!);
  connection.onLogs(programId, (logInfo) => {
    console.log('Program logs:', logInfo);
  }, 'confirmed');
}

monitorLogs().catch(console.error);
```

---

## Gamification Features

The token and optional program include built-in gamification features:

- **Milestone Tracking**: Automatic detection when addresses reach 100M token milestones  
- **Mint Tracking**: Total minted amount per address tracked in program state  
- **Structured Logs**: Program logs for analytics and achievements  
- **Cross-chain Attribution**: Track mints from different chains via CCIP metadata  

See `GAMIFICATION_FEATURES.md` (conceptually similar on Solana) for detailed documentation.

---

## CCIP Integration

The token is compatible with Chainlink CCIP for cross-chain transfers on Solana:

- Implements delegated mint/burn authorities for cross-chain transfers  
- Enhanced minting entrypoint with CCIP metadata tracking (e.g., source chain, message ID)  
- Compatible with Chainlink Cross-Chain Token workflows  

High-level steps:

- On destination chain: assign or delegate the mint authority to the CCIP pool/router program-derived-address (PDA)  
- On source chain: ensure burn authority is controlled by the CCIP pool/router PDA  
- In your program, expose an instruction like `mint_with_ccip(recipient, amount, source_chain, ccip_message_id)` that emits structured logs  

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
````
