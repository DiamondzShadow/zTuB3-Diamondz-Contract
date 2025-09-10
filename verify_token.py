#!/usr/bin/env python3
"""
Token Verification Script for Arbitrum
Token Address: 0x602b869eEf1C9F0487F31776bad8Af3C4A173394
Mint Transaction: 0x1061de9e96b65cc62fabc748d972fefcf7cfc7fc9c518464855ac9744ef7d85d
"""

import json
import requests
from web3 import Web3
from datetime import datetime
from typing import Dict, Any, Optional

# Arbitrum RPC endpoints
ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc"
ARBITRUM_BACKUP_RPC = "https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_KEY"

# Arbiscan API (for contract verification status)
ARBISCAN_API = "https://api.arbiscan.io/api"
ARBISCAN_API_KEY = "IGMMW2DMUS3QIEMIXHA42Q9IZP47X5M8PU"

# Token contract address
TOKEN_ADDRESS = "0x602b869eEf1C9F0487F31776bad8Af3C4A173394"
MINT_TX_HASH = "0x1061de9e96b65cc62fabc748d972fefcf7cfc7fc9c518464855ac9744ef7d85d"

# Standard ERC20 ABI
ERC20_ABI = [
    {
        "constant": True,
        "inputs": [],
        "name": "name",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "owner",
        "outputs": [{"name": "", "type": "address"}],
        "type": "function"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "from", "type": "address"},
            {"indexed": True, "name": "to", "type": "address"},
            {"indexed": False, "name": "value", "type": "uint256"}
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "name": "owner", "type": "address"},
            {"indexed": True, "name": "spender", "type": "address"},
            {"indexed": False, "name": "value", "type": "uint256"}
        ],
        "name": "Approval",
        "type": "event"
    }
]

class TokenVerifier:
    def __init__(self, rpc_url: str = ARBITRUM_RPC):
        """Initialize the token verifier with Web3 connection."""
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        if not self.w3.is_connected():
            print(f"Failed to connect to {rpc_url}, trying backup...")
            self.w3 = Web3(Web3.HTTPProvider(ARBITRUM_BACKUP_RPC))
        
        if not self.w3.is_connected():
            raise ConnectionError("Failed to connect to Arbitrum network")
        
        print(f"✅ Connected to Arbitrum network")
        print(f"   Chain ID: {self.w3.eth.chain_id}")
        print(f"   Latest block: {self.w3.eth.block_number}")
        print()

    def verify_token_contract(self, token_address: str) -> Dict[str, Any]:
        """Verify and analyze the token contract."""
        print(f"🔍 Analyzing Token Contract: {token_address}")
        print("=" * 60)
        
        result = {
            "address": token_address,
            "is_contract": False,
            "contract_info": {},
            "token_info": {},
            "security_checks": {},
            "warnings": []
        }
        
        # Check if address is a contract
        code = self.w3.eth.get_code(Web3.to_checksum_address(token_address))
        result["is_contract"] = len(code) > 0
        
        if not result["is_contract"]:
            result["warnings"].append("⚠️  Address is not a contract!")
            return result
        
        print(f"✅ Address is a valid contract")
        print(f"   Contract size: {len(code)} bytes")
        
        # Get contract creation info
        try:
            # Try to get contract creation transaction (requires archive node or API)
            result["contract_info"]["code_size"] = len(code)
        except Exception as e:
            print(f"   Could not fetch creation info: {e}")
        
        # Try to interact with contract as ERC20
        try:
            contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(token_address),
                abi=ERC20_ABI
            )
            
            # Get basic token info
            token_info = {}
            
            try:
                token_info["name"] = contract.functions.name().call()
                print(f"   Name: {token_info['name']}")
            except:
                token_info["name"] = "Unknown"
                result["warnings"].append("Could not read token name")
            
            try:
                token_info["symbol"] = contract.functions.symbol().call()
                print(f"   Symbol: {token_info['symbol']}")
            except:
                token_info["symbol"] = "Unknown"
                result["warnings"].append("Could not read token symbol")
            
            try:
                token_info["decimals"] = contract.functions.decimals().call()
                print(f"   Decimals: {token_info['decimals']}")
            except:
                token_info["decimals"] = 18
                result["warnings"].append("Could not read decimals, assuming 18")
            
            try:
                total_supply = contract.functions.totalSupply().call()
                token_info["total_supply_raw"] = total_supply
                token_info["total_supply"] = total_supply / (10 ** token_info["decimals"])
                print(f"   Total Supply: {token_info['total_supply']:,.2f} {token_info['symbol']}")
            except:
                result["warnings"].append("Could not read total supply")
            
            try:
                owner = contract.functions.owner().call()
                token_info["owner"] = owner
                print(f"   Owner: {owner}")
            except:
                print("   Owner: No owner function (might be renounced or different implementation)")
            
            result["token_info"] = token_info
            
        except Exception as e:
            result["warnings"].append(f"Error interacting with contract: {e}")
            print(f"⚠️  Error: {e}")
        
        return result

    def analyze_mint_transaction(self, tx_hash: str) -> Dict[str, Any]:
        """Analyze the mint transaction."""
        print(f"\n🔍 Analyzing Mint Transaction: {tx_hash}")
        print("=" * 60)
        
        result = {
            "tx_hash": tx_hash,
            "found": False,
            "details": {},
            "logs": [],
            "warnings": []
        }
        
        try:
            # Get transaction details
            tx = self.w3.eth.get_transaction(tx_hash)
            result["found"] = True
            
            # Get transaction receipt for logs
            receipt = self.w3.eth.get_transaction_receipt(tx_hash)
            
            # Parse transaction details
            details = {
                "block_number": receipt["blockNumber"],
                "from": receipt["from"],
                "to": receipt["to"],
                "contract_address": receipt.get("contractAddress"),
                "status": "Success" if receipt["status"] == 1 else "Failed",
                "gas_used": receipt["gasUsed"],
                "effective_gas_price": receipt.get("effectiveGasPrice", 0),
                "transaction_index": receipt["transactionIndex"],
                "logs_count": len(receipt["logs"])
            }
            
            # Calculate gas cost in ETH
            if details["effective_gas_price"]:
                gas_cost_wei = details["gas_used"] * details["effective_gas_price"]
                details["gas_cost_eth"] = self.w3.from_wei(gas_cost_wei, 'ether')
            
            # Get block timestamp
            block = self.w3.eth.get_block(details["block_number"])
            details["timestamp"] = datetime.fromtimestamp(block["timestamp"]).strftime('%Y-%m-%d %H:%M:%S UTC')
            
            result["details"] = details
            
            print(f"✅ Transaction found")
            print(f"   Block: {details['block_number']}")
            print(f"   Time: {details['timestamp']}")
            print(f"   From: {details['from']}")
            print(f"   To: {details['to']}")
            if details["contract_address"]:
                print(f"   Contract Created: {details['contract_address']}")
            print(f"   Status: {details['status']}")
            print(f"   Gas Used: {details['gas_used']:,}")
            if "gas_cost_eth" in details:
                print(f"   Gas Cost: {details['gas_cost_eth']:.6f} ETH")
            print(f"   Logs: {details['logs_count']} events")
            
            # Parse logs for Transfer events
            if receipt["logs"]:
                print(f"\n📝 Transaction Logs:")
                for i, log in enumerate(receipt["logs"]):
                    log_data = {
                        "index": i,
                        "address": log["address"],
                        "topics": [topic.hex() for topic in log["topics"]],
                        "data": log["data"]
                    }
                    
                    # Check if this is a Transfer event
                    transfer_topic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
                    if len(log["topics"]) > 0 and log["topics"][0].hex() == transfer_topic:
                        print(f"   [{i}] Transfer Event from {log['address']}")
                        if len(log["topics"]) >= 3:
                            from_addr = "0x" + log["topics"][1].hex()[26:]
                            to_addr = "0x" + log["topics"][2].hex()[26:]
                            print(f"       From: {from_addr}")
                            print(f"       To: {to_addr}")
                            
                            # Check if this is a mint (from 0x0)
                            if from_addr == "0x" + "0" * 40:
                                print(f"       ✅ This is a MINT transaction!")
                                log_data["event_type"] = "MINT"
                    
                    result["logs"].append(log_data)
            
            # Check if transaction interacted with our token
            if details["to"] and details["to"].lower() == TOKEN_ADDRESS.lower():
                print(f"\n✅ Transaction directly interacted with the token contract")
            elif details["contract_address"] and details["contract_address"].lower() == TOKEN_ADDRESS.lower():
                print(f"\n✅ This transaction CREATED the token contract!")
                result["details"]["is_creation_tx"] = True
            else:
                # Check logs for interaction
                token_found = False
                for log in receipt["logs"]:
                    if log["address"].lower() == TOKEN_ADDRESS.lower():
                        token_found = True
                        break
                if token_found:
                    print(f"\n✅ Transaction interacted with the token through events")
                else:
                    print(f"\n⚠️  Transaction does not appear to interact with token {TOKEN_ADDRESS}")
                    result["warnings"].append("Transaction may not be related to the specified token")
            
        except Exception as e:
            result["warnings"].append(f"Error fetching transaction: {e}")
            print(f"❌ Error: {e}")
        
        return result

    def check_contract_verification(self, token_address: str) -> Dict[str, Any]:
        """Check if contract is verified on Arbiscan."""
        print(f"\n🔍 Checking Contract Verification on Arbiscan")
        print("=" * 60)
        
        result = {
            "verified": False,
            "source_code": None,
            "compiler_version": None,
            "optimization": None
        }
        
        try:
            # Query Arbiscan API
            params = {
                "module": "contract",
                "action": "getsourcecode",
                "address": token_address,
                "apikey": ARBISCAN_API_KEY
            }
            
            response = requests.get(ARBISCAN_API, params=params, timeout=10)
            data = response.json()
            
            if data["status"] == "1" and data["result"]:
                source = data["result"][0]
                if source["SourceCode"]:
                    result["verified"] = True
                    result["compiler_version"] = source.get("CompilerVersion", "Unknown")
                    result["optimization"] = source.get("OptimizationUsed", "Unknown")
                    result["contract_name"] = source.get("ContractName", "Unknown")
                    
                    print(f"✅ Contract is VERIFIED on Arbiscan")
                    print(f"   Contract Name: {result['contract_name']}")
                    print(f"   Compiler: {result['compiler_version']}")
                    print(f"   Optimization: {result['optimization']}")
                else:
                    print(f"⚠️  Contract is NOT verified on Arbiscan")
                    print(f"   Unverified contracts should be treated with caution")
            else:
                print(f"⚠️  Could not check verification status")
                
        except Exception as e:
            print(f"❌ Error checking verification: {e}")
            result["error"] = str(e)
        
        return result

    def generate_report(self, token_result: Dict, tx_result: Dict, verification_result: Dict) -> str:
        """Generate a comprehensive verification report."""
        report = []
        report.append("\n" + "=" * 70)
        report.append("                    TOKEN VERIFICATION REPORT")
        report.append("=" * 70)
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")
        report.append(f"Network: Arbitrum (Chain ID: 42161)")
        report.append("")
        
        # Token Contract Summary
        report.append("📋 TOKEN CONTRACT SUMMARY")
        report.append("-" * 40)
        report.append(f"Address: {TOKEN_ADDRESS}")
        report.append(f"Is Contract: {'✅ Yes' if token_result['is_contract'] else '❌ No'}")
        
        if token_result["token_info"]:
            info = token_result["token_info"]
            report.append(f"Name: {info.get('name', 'Unknown')}")
            report.append(f"Symbol: {info.get('symbol', 'Unknown')}")
            report.append(f"Decimals: {info.get('decimals', 'Unknown')}")
            if "total_supply" in info:
                report.append(f"Total Supply: {info['total_supply']:,.2f} {info.get('symbol', '')}")
            if "owner" in info:
                report.append(f"Owner: {info['owner']}")
        
        # Verification Status
        report.append("")
        report.append("🔐 VERIFICATION STATUS")
        report.append("-" * 40)
        if verification_result["verified"]:
            report.append("✅ Contract is VERIFIED on Arbiscan")
            report.append(f"   Contract Name: {verification_result.get('contract_name', 'Unknown')}")
            report.append(f"   Compiler: {verification_result.get('compiler_version', 'Unknown')}")
        else:
            report.append("⚠️  Contract is NOT verified on Arbiscan")
            report.append("   Recommendation: Request contract verification from the team")
        
        # Mint Transaction Analysis
        report.append("")
        report.append("💰 MINT TRANSACTION ANALYSIS")
        report.append("-" * 40)
        report.append(f"Transaction Hash: {MINT_TX_HASH}")
        
        if tx_result["found"]:
            details = tx_result["details"]
            report.append(f"Status: {details['status']}")
            report.append(f"Block: {details['block_number']}")
            report.append(f"Timestamp: {details['timestamp']}")
            report.append(f"From: {details['from']}")
            report.append(f"To: {details['to']}")
            if details.get("is_creation_tx"):
                report.append("✅ This transaction CREATED the token contract")
            
            # Check for mint events
            mint_found = False
            for log in tx_result["logs"]:
                if log.get("event_type") == "MINT":
                    mint_found = True
                    break
            
            if mint_found:
                report.append("✅ Mint event detected in transaction")
            else:
                report.append("⚠️  No clear mint event found (may use non-standard implementation)")
        else:
            report.append("❌ Transaction not found")
        
        # Security Recommendations
        report.append("")
        report.append("🛡️  SECURITY RECOMMENDATIONS")
        report.append("-" * 40)
        
        warnings = []
        if not verification_result["verified"]:
            warnings.append("• Contract is not verified - higher risk")
        if token_result["warnings"]:
            warnings.extend([f"• {w}" for w in token_result["warnings"]])
        if tx_result["warnings"]:
            warnings.extend([f"• {w}" for w in tx_result["warnings"]])
        
        if warnings:
            for warning in warnings:
                report.append(warning)
        else:
            report.append("• No critical warnings detected")
        
        report.append("")
        report.append("📌 ADDITIONAL CHECKS RECOMMENDED:")
        report.append("• Verify the project's official website and documentation")
        report.append("• Check liquidity and trading volume on DEXs")
        report.append("• Review holder distribution on Arbiscan")
        report.append("• Look for audit reports if available")
        report.append("• Check social media and community sentiment")
        report.append("• Use tools like Token Sniffer for automated security checks")
        
        report.append("")
        report.append("=" * 70)
        
        return "\n".join(report)


def main():
    """Main function to run the token verification."""
    print("🚀 Starting Token Verification on Arbitrum")
    print("=" * 70)
    print(f"Token Address: {TOKEN_ADDRESS}")
    print(f"Mint TX Hash: {MINT_TX_HASH}")
    print("=" * 70)
    print()
    
    try:
        # Initialize verifier
        verifier = TokenVerifier()
        
        # Verify token contract
        token_result = verifier.verify_token_contract(TOKEN_ADDRESS)
        
        # Analyze mint transaction
        tx_result = verifier.analyze_mint_transaction(MINT_TX_HASH)
        
        # Check contract verification
        verification_result = verifier.check_contract_verification(TOKEN_ADDRESS)
        
        # Generate and print report
        report = verifier.generate_report(token_result, tx_result, verification_result)
        print(report)
        
        # Save report to file
        report_filename = f"token_verification_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(report_filename, "w") as f:
            f.write(report)
        print(f"\n📄 Report saved to: {report_filename}")
        
        # Export results as JSON
        json_results = {
            "timestamp": datetime.now().isoformat(),
            "network": "Arbitrum",
            "token_address": TOKEN_ADDRESS,
            "mint_tx_hash": MINT_TX_HASH,
            "token_verification": token_result,
            "transaction_analysis": tx_result,
            "contract_verification": verification_result
        }
        
        json_filename = f"token_verification_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(json_filename, "w") as f:
            json.dump(json_results, f, indent=2, default=str)
        print(f"📊 JSON data saved to: {json_filename}")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())