#!/usr/bin/env python3
"""
Manual Verification Helper for Arbiscan
This script prepares all the information you need for manual verification
"""

import os
import json
import requests
from web3 import Web3
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
TOKEN_ADDRESS = "0x602b869eEf1C9F0487F31776bad8Af3C4A173394"
CREATION_TX = "0x1061de9e96b65cc62fabc748d972fefcf7cfc7fc9c518464855ac9744ef7d85d"
ARBISCAN_API_KEY = os.getenv('ARBISCAN_API_KEY', 'YOUR_API_KEY_HERE')

def generate_verification_info():
    """Generate all information needed for manual verification."""
    
    print("=" * 80)
    print("                    ARBISCAN MANUAL VERIFICATION HELPER")
    print("=" * 80)
    print()
    print("This helper will provide you with all the information needed to")
    print("manually verify your contract on Arbiscan.")
    print()
    print("-" * 80)
    print()
    
    # Step 1: Direct Link
    print("📌 STEP 1: GO TO VERIFICATION PAGE")
    print("-" * 40)
    print("Click this link or copy to your browser:")
    print(f"https://arbiscan.io/verifyContract?a={TOKEN_ADDRESS}")
    print()
    
    # Step 2: Basic Information
    print("📝 STEP 2: FILL IN BASIC INFORMATION")
    print("-" * 40)
    print("Copy and paste these values:")
    print()
    print(f"Contract Address: {TOKEN_ADDRESS}")
    print("Compiler Type: Solidity (Single file)")
    print("Open Source License Type: 3 (MIT)")
    print()
    
    # Step 3: Compiler Version
    print("🔧 STEP 3: COMPILER VERSION")
    print("-" * 40)
    print("Try these compiler versions (most common for 2024-2025):")
    print("• v0.8.20+commit.a1b79de6")
    print("• v0.8.19+commit.7dd6d404")
    print("• v0.8.18+commit.87f61d96")
    print("• v0.8.17+commit.8df45f5f")
    print()
    print("💡 TIP: Check your deployment files for the exact version:")
    print("• Hardhat: hardhat.config.js -> solidity.version")
    print("• Truffle: truffle-config.js -> compilers.solc.version")
    print("• Remix: Settings tab -> Compiler version")
    print()
    
    # Step 4: Optimization
    print("⚙️ STEP 4: OPTIMIZATION SETTINGS")
    print("-" * 40)
    print("Standard settings (try these first):")
    print("• Optimization: Yes")
    print("• Runs: 200")
    print("• EVM Version: default (or london/paris)")
    print()
    
    # Step 5: Source Code
    print("📄 STEP 5: CONTRACT SOURCE CODE")
    print("-" * 40)
    print("You need the EXACT source code used for deployment.")
    print()
    print("If you don't have it, here's a standard ERC20 template to try:")
    print("(Save this to a file named 'SDM_Token.sol')")
    print()
    
    # Create source file
    source_code = '''// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DiamondzShadowGameMovies is ERC20, Ownable {
    constructor() ERC20("Diamondz Shadow Game + Movies", "SDM") {
        _mint(msg.sender, 4000000000 * 10 ** decimals());
    }
}'''
    
    with open("SDM_Token_Template.sol", "w") as f:
        f.write(source_code)
    
    print("✅ Template saved to: SDM_Token_Template.sol")
    print()
    print("If using OpenZeppelin, you'll need the flattened version.")
    print("Use one of these tools to flatten:")
    print("• Online: https://www.solt.tools/")
    print("• Remix: Right-click on contract -> Flatten")
    print("• Hardhat: npx hardhat flatten contracts/YourContract.sol")
    print()
    
    # Step 6: Constructor Arguments
    print("🔨 STEP 6: CONSTRUCTOR ARGUMENTS")
    print("-" * 40)
    print("This token appears to have NO constructor arguments")
    print("Leave this field EMPTY")
    print()
    
    # Step 7: Libraries
    print("📚 STEP 7: LIBRARIES")
    print("-" * 40)
    print("No libraries detected - leave this section empty")
    print()
    
    # Step 8: Final Steps
    print("✅ STEP 8: SUBMIT VERIFICATION")
    print("-" * 40)
    print("1. Double-check all information")
    print("2. Complete the CAPTCHA")
    print("3. Click 'Verify and Publish'")
    print("4. Wait for processing (usually instant)")
    print()
    
    # Additional Help
    print("=" * 80)
    print("                         TROUBLESHOOTING")
    print("=" * 80)
    print()
    print("❌ If verification fails, common issues are:")
    print()
    print("1. WRONG COMPILER VERSION")
    print("   → Check your deployment transaction on Arbiscan")
    print("   → Look for compiler hints in the bytecode")
    print()
    print("2. WRONG SOURCE CODE")
    print("   → Make sure you're using the exact code deployed")
    print("   → Include all imports (flattened)")
    print()
    print("3. WRONG OPTIMIZATION SETTINGS")
    print("   → Try with optimization OFF if ON doesn't work")
    print("   → Try different runs values (200, 999999, 1)")
    print()
    print("4. MISSING DEPENDENCIES")
    print("   → Flatten your contract to include all imports")
    print("   → Remove unnecessary imports/comments")
    print()
    
    # API Key reminder
    print("=" * 80)
    print("                      USING YOUR API KEY")
    print("=" * 80)
    print()
    print("Your Arbiscan API Key: " + ARBISCAN_API_KEY)
    print()
    print("For programmatic verification (if you have the source):")
    print()
    print("HARDHAT:")
    print("---------")
    print("npx hardhat verify --network arbitrum \\")
    print(f"  {TOKEN_ADDRESS}")
    print()
    print("Add to hardhat.config.js:")
    print("etherscan: {")
    print("  apiKey: {")
    print(f'    arbitrumOne: "{ARBISCAN_API_KEY}"')
    print("  }")
    print("}")
    print()
    print("FOUNDRY:")
    print("--------")
    print(f"export ARBISCAN_API_KEY={ARBISCAN_API_KEY}")
    print("forge verify-contract \\")
    print(f"  {TOKEN_ADDRESS} \\")
    print("  src/YourContract.sol:ContractName \\")
    print("  --chain arbitrum \\")
    print("  --watch")
    print()
    
    # Save info to file
    info = {
        "contract_address": TOKEN_ADDRESS,
        "creation_tx": CREATION_TX,
        "arbiscan_api_key": ARBISCAN_API_KEY,
        "verification_url": f"https://arbiscan.io/verifyContract?a={TOKEN_ADDRESS}",
        "token_info": {
            "name": "Diamondz Shadow Game + Movies",
            "symbol": "SDM",
            "decimals": 18,
            "total_supply": "4000000000"
        },
        "recommended_settings": {
            "compiler_versions": [
                "v0.8.20+commit.a1b79de6",
                "v0.8.19+commit.7dd6d404",
                "v0.8.18+commit.87f61d96"
            ],
            "optimization": True,
            "runs": 200,
            "evm_version": "default"
        }
    }
    
    with open("verification_info.json", "w") as f:
        json.dump(info, f, indent=2)
    
    print("=" * 80)
    print("📄 All information saved to: verification_info.json")
    print("📄 Template contract saved to: SDM_Token_Template.sol")
    print("=" * 80)

if __name__ == "__main__":
    generate_verification_info()