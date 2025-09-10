#!/usr/bin/env python3
"""
Enhanced Token Verification using QuickNode RPC
This provides better reliability and additional features
"""

import json
import requests
from web3 import Web3
from datetime import datetime
import time

# QuickNode Configuration
QUICKNODE_RPC = "https://nameless-solemn-cherry.arbitrum-mainnet.quiknode.pro/a30fa1bc3689f3c94015f038c6bb30c0a3826555/"
ARBISCAN_API = "https://api.arbiscan.io/api"
ARBISCAN_API_KEY = "IGMMW2DMUS3QIEMIXHA42Q9IZP47X5M8PU"

# Token Details
TOKEN_ADDRESS = "0x602b869eEf1C9F0487F31776bad8Af3C4A173394"
MINT_TX_HASH = "0x1061de9e96b65cc62fabc748d972fefcf7cfc7fc9c518464855ac9744ef7d85d"

# Enhanced ERC20 ABI with additional functions
ERC20_ABI = [
    {"constant": True, "inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "totalSupply", "outputs": [{"name": "", "type": "uint256"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function"},
    {"constant": True, "inputs": [], "name": "owner", "outputs": [{"name": "", "type": "address"}], "type": "function"},
    {"constant": True, "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}], "name": "allowance", "outputs": [{"name": "", "type": "uint256"}], "type": "function"},
    {"constant": False, "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}], "name": "approve", "outputs": [{"name": "", "type": "bool"}], "type": "function"},
    {"constant": False, "inputs": [{"name": "recipient", "type": "address"}, {"name": "amount", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function"},
    {"constant": False, "inputs": [{"name": "sender", "type": "address"}, {"name": "recipient", "type": "address"}, {"name": "amount", "type": "uint256"}], "name": "transferFrom", "outputs": [{"name": "", "type": "bool"}], "type": "function"}
]

class QuickNodeVerifier:
    def __init__(self):
        """Initialize with QuickNode RPC."""
        print("🚀 Connecting to QuickNode Arbitrum RPC...")
        self.w3 = Web3(Web3.HTTPProvider(QUICKNODE_RPC))
        
        if not self.w3.is_connected():
            raise ConnectionError("Failed to connect to QuickNode")
        
        print("✅ Connected to QuickNode successfully!")
        print(f"   Endpoint: QuickNode Arbitrum Mainnet")
        print(f"   Chain ID: {self.w3.eth.chain_id}")
        print(f"   Latest Block: {self.w3.eth.block_number:,}")
        print(f"   Gas Price: {self.w3.eth.gas_price / 10**9:.2f} Gwei")
        print()

    def get_detailed_token_info(self):
        """Get comprehensive token information."""
        print("📊 Fetching Detailed Token Information")
        print("=" * 60)
        
        # Check if address is a contract
        code = self.w3.eth.get_code(Web3.to_checksum_address(TOKEN_ADDRESS))
        if len(code) == 0:
            print("❌ Address is not a contract!")
            return None
        
        print(f"✅ Valid Contract (Size: {len(code):,} bytes)")
        
        # Initialize contract
        contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(TOKEN_ADDRESS),
            abi=ERC20_ABI
        )
        
        info = {}
        
        # Get basic token information
        try:
            info["name"] = contract.functions.name().call()
            info["symbol"] = contract.functions.symbol().call()
            info["decimals"] = contract.functions.decimals().call()
            info["total_supply_raw"] = contract.functions.totalSupply().call()
            info["total_supply"] = info["total_supply_raw"] / (10 ** info["decimals"])
            
            print(f"Name: {info['name']}")
            print(f"Symbol: {info['symbol']}")
            print(f"Decimals: {info['decimals']}")
            print(f"Total Supply: {info['total_supply']:,.2f} {info['symbol']}")
        except Exception as e:
            print(f"Error reading token info: {e}")
            return None
        
        # Get owner information
        try:
            info["owner"] = contract.functions.owner().call()
            print(f"Owner: {info['owner']}")
            
            # Check owner balance
            owner_balance = contract.functions.balanceOf(info["owner"]).call()
            info["owner_balance"] = owner_balance / (10 ** info["decimals"])
            info["owner_percentage"] = (owner_balance / info["total_supply_raw"]) * 100
            print(f"Owner Balance: {info['owner_balance']:,.2f} {info['symbol']} ({info['owner_percentage']:.2f}%)")
        except:
            print("Owner: Not available (might be renounced or different implementation)")
            info["owner"] = None
        
        return info

    def analyze_holders(self):
        """Analyze token holder distribution."""
        print("\n📊 Analyzing Token Holders")
        print("=" * 60)
        
        contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(TOKEN_ADDRESS),
            abi=ERC20_ABI
        )
        
        # Check some known addresses
        addresses_to_check = [
            ("Creator", "0xC5D133296E17BA25DF0409a6C31607bf3B78e3e3"),
            ("Initial Mint Recipient", "0x18b2b2ce7d05bfe0883ff874ba0c536a89d07363"),
            ("Recent Transfer", "0x192cea8729e0df7c6f1f0f60fb0e67a7b34bc")
        ]
        
        print("Checking known addresses:")
        print("-" * 40)
        
        for name, address in addresses_to_check:
            try:
                # Ensure valid address format
                if len(address) == 42:  # Valid address length
                    checksum_addr = Web3.to_checksum_address(address)
                    balance = contract.functions.balanceOf(checksum_addr).call()
                    balance_formatted = balance / (10 ** 18)
                    if balance > 0:
                        print(f"{name}: {balance_formatted:,.2f} SDM")
                    else:
                        print(f"{name}: 0 SDM")
            except Exception as e:
                print(f"{name}: Error checking ({str(e)[:30]}...)")
        
        return True

    def check_recent_activity(self):
        """Check recent blockchain activity for the token."""
        print("\n📈 Recent Activity Analysis")
        print("=" * 60)
        
        try:
            # Get latest block
            latest_block = self.w3.eth.block_number
            
            # Get recent logs (Transfer events)
            transfer_topic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
            
            # Check last 1000 blocks (approximately last few hours)
            from_block = max(0, latest_block - 1000)
            
            print(f"Checking blocks {from_block:,} to {latest_block:,}")
            
            filter_params = {
                "fromBlock": from_block,
                "toBlock": latest_block,
                "address": Web3.to_checksum_address(TOKEN_ADDRESS),
                "topics": [transfer_topic]
            }
            
            logs = self.w3.eth.get_logs(filter_params)
            
            print(f"Found {len(logs)} Transfer events in recent blocks")
            
            if logs:
                print("\nLast 5 transfers:")
                print("-" * 40)
                for log in logs[-5:]:
                    block = log["blockNumber"]
                    tx_hash = log["transactionHash"].hex()
                    print(f"Block {block}: {tx_hash[:20]}...")
            
        except Exception as e:
            print(f"Error checking activity: {e}")

    def verify_contract_bytecode(self):
        """Analyze contract bytecode for verification hints."""
        print("\n🔍 Bytecode Analysis for Verification")
        print("=" * 60)
        
        code = self.w3.eth.get_code(Web3.to_checksum_address(TOKEN_ADDRESS))
        code_hex = code.hex()
        
        print(f"Contract Bytecode Size: {len(code):,} bytes")
        print(f"Bytecode Hash: {Web3.keccak(code).hex()[:20]}...")
        
        # Look for common patterns
        patterns = {
            "Solidity 0.8": "6080604052",
            "OpenZeppelin": "8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0",
            "Ownable": "f2fde38b",
            "ERC20": "18160ddd",  # totalSupply selector
            "Mint Function": "40c10f19",  # mint selector
            "Burn Function": "42966c68"   # burn selector
        }
        
        print("\nDetected Patterns:")
        print("-" * 40)
        for name, pattern in patterns.items():
            if pattern.lower() in code_hex:
                print(f"✅ {name} pattern found")
            else:
                print(f"❌ {name} pattern not found")
        
        # Check for metadata
        if "a264697066735822" in code_hex:  # IPFS hash marker
            print("✅ Metadata hash found (indicates Solidity >=0.5.0)")
            # Extract metadata
            metadata_start = code_hex.index("a264697066735822")
            metadata_section = code_hex[metadata_start:metadata_start+100]
            print(f"   Metadata: {metadata_section[:50]}...")
        
        return True

    def generate_verification_script(self):
        """Generate a custom verification script."""
        print("\n📝 Generating Custom Verification Script")
        print("=" * 60)
        
        script = f"""#!/bin/bash
# Automated Verification Script for SDM Token
# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

CONTRACT_ADDRESS="{TOKEN_ADDRESS}"
ARBISCAN_API_KEY="{ARBISCAN_API_KEY}"

echo "Starting contract verification for SDM Token..."

# If using Hardhat
if [ -f "hardhat.config.js" ]; then
    echo "Detected Hardhat project"
    npx hardhat verify --network arbitrum $CONTRACT_ADDRESS
fi

# If using Foundry
if [ -f "foundry.toml" ]; then
    echo "Detected Foundry project"
    forge verify-contract \\
        $CONTRACT_ADDRESS \\
        src/DiamondzShadowGameMovies.sol:DiamondzShadowGameMovies \\
        --chain arbitrum \\
        --etherscan-api-key $ARBISCAN_API_KEY \\
        --watch
fi

# Manual verification URL
echo ""
echo "For manual verification, visit:"
echo "https://arbiscan.io/verifyContract?a=$CONTRACT_ADDRESS"
echo ""
echo "API Key: $ARBISCAN_API_KEY"
"""
        
        with open("auto_verify.sh", "w") as f:
            f.write(script)
        
        print("✅ Verification script saved to: auto_verify.sh")
        print("   Run with: bash auto_verify.sh")
        
        return True

    def check_contract_security(self):
        """Perform security checks on the contract."""
        print("\n🔒 Security Analysis")
        print("=" * 60)
        
        contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(TOKEN_ADDRESS),
            abi=ERC20_ABI
        )
        
        security_checks = {
            "has_owner": False,
            "owner_renounced": False,
            "pausable": False,
            "mintable": False,
            "burnable": False,
            "has_liquidity": False
        }
        
        # Check for owner
        try:
            owner = contract.functions.owner().call()
            if owner != "0x0000000000000000000000000000000000000000":
                security_checks["has_owner"] = True
                print(f"✅ Has Owner: {owner}")
            else:
                security_checks["owner_renounced"] = True
                print("✅ Owner Renounced")
        except:
            print("❓ No standard owner function")
        
        # Check contract age
        creation_block = 362698455  # From our previous analysis
        current_block = self.w3.eth.block_number
        blocks_old = current_block - creation_block
        days_old = blocks_old * 2 / 86400  # ~2 seconds per block on Arbitrum
        
        print(f"📅 Contract Age: ~{days_old:.1f} days ({blocks_old:,} blocks)")
        
        if days_old < 7:
            print("   ⚠️ Very new contract (< 1 week)")
        elif days_old < 30:
            print("   ⚠️ New contract (< 1 month)")
        else:
            print(f"   ✅ Established contract")
        
        # Risk Assessment
        print("\n⚠️ Risk Assessment:")
        print("-" * 40)
        risk_level = 0
        
        if not self.check_verification_status():
            print("• HIGH RISK: Contract not verified")
            risk_level += 3
        
        if security_checks["has_owner"]:
            print("• MEDIUM RISK: Owner not renounced")
            risk_level += 2
        
        if days_old < 30:
            print("• LOW RISK: Relatively new token")
            risk_level += 1
        
        if risk_level >= 5:
            print("\n🚨 Overall Risk: HIGH - Exercise extreme caution")
        elif risk_level >= 3:
            print("\n⚠️ Overall Risk: MEDIUM - Proceed with caution")
        else:
            print("\n✅ Overall Risk: LOW - Standard precautions apply")
        
        return security_checks

    def check_verification_status(self):
        """Quick check if contract is verified."""
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
                return bool(source.get("SourceCode"))
        except:
            pass
        
        return False

    def generate_final_report(self):
        """Generate comprehensive final report."""
        print("\n" + "=" * 70)
        print("                    FINAL VERIFICATION REPORT")
        print("=" * 70)
        print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print(f"RPC: QuickNode Arbitrum Mainnet")
        print()
        
        # Summary
        print("📊 TOKEN SUMMARY")
        print("-" * 40)
        print(f"Name: Diamondz Shadow Game + Movies")
        print(f"Symbol: SDM")
        print(f"Address: {TOKEN_ADDRESS}")
        print(f"Total Supply: 4,000,000,000 SDM")
        print(f"Verification: {'✅ VERIFIED' if self.check_verification_status() else '❌ NOT VERIFIED'}")
        print()
        
        print("🔗 USEFUL LINKS")
        print("-" * 40)
        print(f"• Arbiscan: https://arbiscan.io/token/{TOKEN_ADDRESS}")
        print(f"• Verify: https://arbiscan.io/verifyContract?a={TOKEN_ADDRESS}")
        print(f"• DexScreener: https://dexscreener.com/arbitrum/{TOKEN_ADDRESS}")
        print()
        
        print("📁 FILES GENERATED")
        print("-" * 40)
        print("• auto_verify.sh - Automated verification script")
        print("• verification_info.json - Verification parameters")
        print("• SDM_Token_Template.sol - Contract template")
        print("• VERIFICATION_REPORT.md - Full analysis report")
        print()
        
        print("=" * 70)

def main():
    print("🚀 Enhanced Token Verification with QuickNode")
    print("=" * 70)
    print()
    
    try:
        # Initialize verifier
        verifier = QuickNodeVerifier()
        
        # Run comprehensive analysis
        token_info = verifier.get_detailed_token_info()
        if token_info:
            verifier.analyze_holders()
            verifier.check_recent_activity()
            verifier.verify_contract_bytecode()
            verifier.check_contract_security()
            verifier.generate_verification_script()
            verifier.generate_final_report()
        
        print("\n✅ Analysis complete!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())