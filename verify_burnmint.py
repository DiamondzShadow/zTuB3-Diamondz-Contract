#!/usr/bin/env python3
"""
Verification script for BurnMintERC677 token on Arbitrum
"""

import json
import requests
import time
import subprocess
import os

# Configuration
ARBISCAN_API = "https://api.arbiscan.io/api"
ARBISCAN_API_KEY = "IGMMW2DMUS3QIEMIXHA42Q9IZP47X5M8PU"
TOKEN_ADDRESS = "0x602b869eEf1C9F0487F31776bad8Af3C4A173394"

def flatten_contract():
    """Flatten the BurnMintERC677 contract."""
    print("📝 Flattening contract...")
    try:
        # Use forge flatten to get the complete source code
        result = subprocess.run(
            ["forge", "flatten", "src/tokens/BurnMintERC677.sol"],
            capture_output=True,
            text=True,
            cwd="/workspace"
        )
        
        if result.returncode == 0:
            flattened = result.stdout
            # Save flattened contract
            with open("/workspace/BurnMintERC677_flattened.sol", "w") as f:
                f.write(flattened)
            print("✅ Contract flattened successfully")
            return flattened
        else:
            print(f"❌ Error flattening: {result.stderr}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def verify_contract(source_code):
    """Submit contract for verification."""
    print("\n📤 Submitting contract for verification...")
    
    # Constructor arguments (ABI encoded)
    # constructor(string memory name_, string memory symbol_, address initialAccount)
    # name: "Diamondz Shadow Game + Movies"
    # symbol: "SDM"
    # initialAccount: 0x18b2b2ce7d05bfe0883ff874ba0c536a89d07363 (received initial mint)
    constructor_args = "000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000018b2b2ce7d05bfe0883ff874ba0c536a89d07363000000000000000000000000000000000000000000000000000000000000001d4469616d6f6e647a20536861646f772047616d65202b204d6f766965730000000000000000000000000000000000000000000000000000000000000000000003534d0000000000000000000000000000000000000000000000000000000000"
    
    params = {
        "module": "contract",
        "action": "verifysourcecode",
        "contractaddress": TOKEN_ADDRESS,
        "sourceCode": source_code,
        "codeformat": "solidity-single-file",
        "contractname": "BurnMintERC677",
        "compilerversion": "v0.8.19+commit.7dd6d404",
        "optimizationUsed": "1",
        "runs": "200",
        "constructorArguements": constructor_args,  # Note: Arbiscan uses this spelling
        "evmversion": "paris",  # Default for 0.8.19
        "licenseType": "3",  # MIT
        "apikey": ARBISCAN_API_KEY
    }
    
    try:
        response = requests.post(ARBISCAN_API, data=params, timeout=60)
        data = response.json()
        
        if data.get("status") == "1":
            guid = data["result"]
            print(f"✅ Verification submitted! GUID: {guid}")
            return guid
        else:
            error_msg = data.get("result", "Unknown error")
            print(f"❌ Submission failed: {error_msg}")
            
            # If it's already verified, that's good news
            if "already verified" in error_msg.lower():
                print("✅ Contract is already verified!")
                return "already_verified"
            
            return None
            
    except Exception as e:
        print(f"❌ Error submitting: {e}")
        return None

def check_verification_status(guid):
    """Check the status of verification."""
    if guid == "already_verified":
        return True
        
    print(f"\n🔍 Checking verification status...")
    
    params = {
        "module": "contract",
        "action": "checkverifystatus",
        "guid": guid,
        "apikey": ARBISCAN_API_KEY
    }
    
    max_attempts = 10
    for attempt in range(max_attempts):
        try:
            time.sleep(3)  # Wait between checks
            response = requests.get(ARBISCAN_API, params=params, timeout=10)
            data = response.json()
            
            status = data.get("status", "0")
            result = data.get("result", "")
            
            if status == "1":
                print(f"✅ Verification SUCCESSFUL!")
                return True
            elif "pending" in result.lower():
                print(f"⏳ Verification pending... (attempt {attempt + 1}/{max_attempts})")
            elif "fail" in result.lower():
                print(f"❌ Verification failed: {result}")
                return False
            else:
                print(f"Status: {result}")
                
        except Exception as e:
            print(f"Error checking status: {e}")
    
    return False

def main():
    print("🚀 BurnMintERC677 Contract Verification")
    print("=" * 60)
    print(f"Contract: {TOKEN_ADDRESS}")
    print(f"Network: Arbitrum")
    print("=" * 60)
    
    # Check if already verified
    print("\n🔍 Checking current verification status...")
    params = {
        "module": "contract",
        "action": "getsourcecode",
        "address": TOKEN_ADDRESS,
        "apikey": ARBISCAN_API_KEY
    }
    
    try:
        response = requests.get(ARBISCAN_API, params=params, timeout=10)
        data = response.json()
        
        if data["status"] == "1" and data["result"]:
            source = data["result"][0]
            if source.get("SourceCode") and source["SourceCode"] != "":
                print("✅ Contract is ALREADY VERIFIED!")
                print(f"   Contract Name: {source.get('ContractName', 'Unknown')}")
                print(f"   Compiler: {source.get('CompilerVersion', 'Unknown')}")
                print(f"   Optimization: {source.get('OptimizationUsed', 'Unknown')}")
                print(f"\n🔗 View on Arbiscan:")
                print(f"   https://arbiscan.io/address/{TOKEN_ADDRESS}#code")
                return 0
            else:
                print("❌ Contract is NOT verified")
    except Exception as e:
        print(f"Error checking status: {e}")
    
    # Flatten contract
    source_code = flatten_contract()
    if not source_code:
        print("\n❌ Failed to flatten contract")
        return 1
    
    # Submit for verification
    guid = verify_contract(source_code)
    if not guid:
        print("\n❌ Failed to submit verification")
        print("\n💡 Try manual verification at:")
        print(f"   https://arbiscan.io/verifyContract?a={TOKEN_ADDRESS}")
        return 1
    
    # Check status
    if check_verification_status(guid):
        print("\n🎉 SUCCESS! Contract verified on Arbiscan")
        print(f"\n🔗 View verified contract:")
        print(f"   https://arbiscan.io/address/{TOKEN_ADDRESS}#code")
        return 0
    else:
        print("\n❌ Verification not completed")
        print("\n💡 Try manual verification at:")
        print(f"   https://arbiscan.io/verifyContract?a={TOKEN_ADDRESS}")
        return 1

if __name__ == "__main__":
    exit(main())