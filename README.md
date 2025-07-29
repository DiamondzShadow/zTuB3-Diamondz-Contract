````markdown
# zsT3Token (zsLabTuB3)

> An upgradeable, Pausable, oracle-driven ERC-20 token with governance, gasless permits, voting, and burn mechanics—ideal for media/tokenized content ecosystems.

## Table of Contents

- [Overview](#overview)  
- [Features](#features)  
- [Prerequisites](#prerequisites)  
- [Getting Started](#getting-started)  
  - [Clone & Install](#clone----install)  
  - [Configure Environment](#configure-environment)  
  - [Compile & Test](#compile----test)  
- [Deployment](#deployment)  
  - [Dry Run](#dry-run)  
  - [Live Deploy](#live-deploy)  
  - [Verify & ABI](#verify----abi)  
- [Usage Examples](#usage-examples)  
  - [Ethers.js](#ethersjs)  
  - [CLI](#cli)  
  - [SDK](#sdk)  
- [Upgrading](#upgrading)  
- [Contributing](#contributing)  
- [License](#license)

---

## Overview

`zsT3Token` is an ERC-20 token running behind a UUPS proxy. It’s designed for on-chain media ecosystems where:

- **Oracle-driven minting** (e.g. mint on video views).  
- **Automatic burn** above a max supply and **safeguarded minimum supply**.  
- **On-chain governance** via ERC-20 Votes.  
- **Gasless approvals** with Permit.  
- **Pausable** for emergency halts.  
- **Transfer-and-call** patterns (ERC-1363) for pay-per-view or tip flows.  

---

## Features

- ✅ Upgradeable (UUPS)  
- 🔥 Burnable & automatic supply control  
- ⏸️ Emergency pause/unpause  
- 📜 Gasless approvals (ERC-2612 Permit)  
- 📊 On-chain voting (ERC-20 Votes)  
- 🎬 Oracle-triggered minting with metadata events  
- 🛡️ Minimum supply guardrail  
- 🏦 Treasury administration  

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
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
```

**macOS:**
```bash
# Using Homebrew
brew install node

# Or using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc
nvm install --lts
nvm use --lts
```

**Windows PowerShell:**
```powershell
# Using winget
winget install OpenJS.NodeJS.LTS

# Or using Chocolatey
choco install nodejs-lts -y

# Or using nvm for Windows
irm https://github.com/coreybutler/nvm-windows/releases/download/1.1.11/nvm-setup.exe -OutFile nvm-setup.exe
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
forge init .          # if you haven’t already
forge install OpenZeppelin/openzeppelin-contracts-upgradeable
forge install OpenZeppelin/openzeppelin-contracts
````

### Configure Environment

Create a local `.env` (never committed):

```ini
RPC_URL="https://hardworking-greatest-road.diamondz-zslab.quiknode.pro/"
PRIVATE_KEY="0xyourPrivateKeyHere"
ORACLE="0xOracleAddress"
TREASURY="0xTreasuryAddress"
```

Load it:

```bash
source .env
```

### Compile & Test

```bash
forge clean
forge build
# (optional) run any tests you have
forge test
```

---

## Deployment

### Dry Run

```bash
forge script script/DeployT3Token.s.sol:DeployT3Token \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY
```

– This simulates gas costs without sending transactions.

### Live Deploy

```bash
forge script script/DeployT3Token.s.sol:DeployT3Token \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

You’ll see two TX hashes and the **proxy address** in the logs.

### Verify & ABI

```bash
export PROXY=<YourProxyAddress>
cast call $PROXY "name()(string)"   --rpc-url $RPC_URL   # expect "zsLabTuB3"
cast call $PROXY "symbol()(string)" --rpc-url $RPC_URL   # expect "zsT3"

# Extract ABI for frontend/SDK
forge inspect src/zsT3Token.sol:zsT3Token abi > abi.json

git add abi.json
git commit -m "Add zsT3Token ABI post-deploy"
git push
```

---

## Usage Examples

### Ethers.js

```ts
import { ethers } from "ethers";
import abi from "./abi.json";

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(process.env.PROXY, abi, provider);

async function main() {
  console.log(await contract.name());
  console.log(await contract.totalSupply());
}
main();
```

### CLI

Install the CLI (if you published or linked it):

```bash
npm install -g zstb-cli
zstb name
zstb totalSupply
zstb mint --to 0xUser --amount 1000
zstb burn --amount 500
```

### SDK

```ts
import { ZsTB } from "zstb-sdk";
const sdk = new ZsTB(RPC_URL, PRIVATE_KEY, PROXY);

await sdk.mint("0xUser", "1000");
await sdk.burn("500");
```

---

## Upgrading

1. Update your logic in `src/zsT3Token.sol`.
2. Bump the version/tag of your OZ submodules (if used).
3. Write a new upgrade script calling `upgradeTo(newImpl)` on your proxy.
4. Broadcast and verify.

---

## Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/foo`)
3. Commit your changes (`git commit -am "Add foo"`)
4. Push (`git push origin feature/foo`)
5. Open a Pull Request

---

## License

This project is licensed under the [Apache License 2.0](LICENSE).
