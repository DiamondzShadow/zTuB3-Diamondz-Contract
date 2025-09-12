#!/usr/bin/env python3
"""
Additional Token Analysis for SDM Token on Arbitrum
"""

import json
import requests
from web3 import Web3
from datetime import datetime
import time

# Configuration
ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc"
ARBISCAN_API = "https://api.arbiscan.io/api"
ARBISCAN_API_KEY = "IGMMW2DMUS3QIEMIXHA42Q9IZP47X5M8PU"
TOKEN_ADDRESS = "0x602b869eEf1C9F0487F31776bad8Af3C4A173394"

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(ARBITRUM_RPC))

def get_token_holders():
    """Get top token holders from Arbiscan."""
    print("📊 Fetching Token Holder Information...")
    print("-" * 50)
    
    params = {
        "module": "token",
        "action": "tokenholderlist",
        "contractaddress": TOKEN_ADDRESS,
        "page": "1",
        "offset": "20",
        "apikey": ARBISCAN_API_KEY
    }
    
    try:
        response = requests.get(ARBISCAN_API, params=params, timeout=10)
        data = response.json()
        
        if data["status"] == "1" and data["result"]:
            holders = data["result"]
            print(f"Total holders found: {len(holders)}")
            print("\nTop 10 Holders:")
            print("-" * 50)
            
            total_supply = 4000000000 * 10**18  # 4B tokens with 18 decimals
            
            for i, holder in enumerate(holders[:10], 1):
                balance = int(holder["TokenHolderQuantity"])
                percentage = (balance / total_supply) * 100
                readable_balance = balance / 10**18
                
                print(f"{i}. {holder['TokenHolderAddress']}")
                print(f"   Balance: {readable_balance:,.2f} SDM ({percentage:.2f}%)")
            
            return holders
        else:
            print("No holder data available yet")
            return []
            
    except Exception as e:
        print(f"Error fetching holders: {e}")
        return []

def get_token_transfers():
    """Get recent token transfers."""
    print("\n📤 Recent Token Transfers")
    print("-" * 50)
    
    params = {
        "module": "account",
        "action": "tokentx",
        "contractaddress": TOKEN_ADDRESS,
        "page": "1",
        "offset": "20",
        "sort": "desc",
        "apikey": ARBISCAN_API_KEY
    }
    
    try:
        response = requests.get(ARBISCAN_API, params=params, timeout=10)
        data = response.json()
        
        if data["status"] == "1" and data["result"]:
            transfers = data["result"]
            print(f"Found {len(transfers)} recent transfers")
            print("\nLast 5 Transfers:")
            print("-" * 50)
            
            for i, tx in enumerate(transfers[:5], 1):
                value = int(tx["value"]) / 10**18
                timestamp = datetime.fromtimestamp(int(tx["timeStamp"]))
                
                print(f"{i}. {timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"   From: {tx['from'][:10]}...{tx['from'][-8:]}")
                print(f"   To: {tx['to'][:10]}...{tx['to'][-8:]}")
                print(f"   Amount: {value:,.2f} SDM")
                print(f"   Hash: {tx['hash'][:20]}...")
            
            return transfers
        else:
            print("No transfer data available")
            return []
            
    except Exception as e:
        print(f"Error fetching transfers: {e}")
        return []

def check_liquidity_pools():
    """Check for liquidity pools on popular DEXs."""
    print("\n💧 Checking Liquidity Pools")
    print("-" * 50)
    
    # Common DEX factory addresses on Arbitrum
    dex_info = {
        "Uniswap V3": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
        "SushiSwap": "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
        "Camelot": "0x6EcCab422D763aC031210895C81787E87B43A652"
    }
    
    print("Checking popular DEXs for liquidity pools...")
    
    # This would require more complex queries to find actual pools
    # For now, we'll provide the links to check manually
    
    print("\n📌 Check these DEX analytics:")
    print(f"• Uniswap: https://info.uniswap.org/#/arbitrum/tokens/{TOKEN_ADDRESS}")
    print(f"• SushiSwap: https://www.sushi.com/analytics/token/arbitrum/{TOKEN_ADDRESS}")
    print(f"• Camelot: https://info.camelot.exchange/token/{TOKEN_ADDRESS}")
    print(f"• DexScreener: https://dexscreener.com/arbitrum/{TOKEN_ADDRESS}")

def get_contract_events():
    """Get recent contract events."""
    print("\n📝 Recent Contract Events")
    print("-" * 50)
    
    params = {
        "module": "logs",
        "action": "getLogs",
        "address": TOKEN_ADDRESS,
        "fromBlock": "0",
        "toBlock": "latest",
        "page": "1",
        "offset": "10",
        "apikey": ARBISCAN_API_KEY
    }
    
    try:
        response = requests.get(ARBISCAN_API, params=params, timeout=10)
        data = response.json()
        
        if data["status"] == "1" and data["result"]:
            events = data["result"]
            print(f"Found {len(events)} recent events")
            
            # Count event types
            transfer_events = 0
            approval_events = 0
            other_events = 0
            
            for event in events:
                if len(event["topics"]) > 0:
                    topic = event["topics"][0]
                    if topic == "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef":
                        transfer_events += 1
                    elif topic == "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925":
                        approval_events += 1
                    else:
                        other_events += 1
            
            print(f"• Transfer events: {transfer_events}")
            print(f"• Approval events: {approval_events}")
            print(f"• Other events: {other_events}")
            
            return events
        else:
            print("No event data available")
            return []
            
    except Exception as e:
        print(f"Error fetching events: {e}")
        return []

def analyze_token_security():
    """Perform basic security analysis."""
    print("\n🔒 Security Analysis")
    print("-" * 50)
    
    security_flags = {
        "verified_contract": False,
        "has_liquidity": "Unknown",
        "holder_concentration": "Unknown",
        "active_trading": "Unknown",
        "owner_renounced": False
    }
    
    # Check contract verification (already done in main script)
    print("✓ Contract Verification: NOT VERIFIED ⚠️")
    
    # Check owner
    print(f"✓ Owner Address: 0xC5D133296E17BA25DF0409a6C31607bf3B78e3e3")
    print("  → Owner has NOT been renounced")
    
    # Token age
    creation_date = datetime(2025, 7, 29, 5, 26, 31)
    age_days = (datetime.now() - creation_date).days
    print(f"✓ Token Age: {age_days} days")
    
    if age_days < 7:
        print("  → ⚠️ Very new token (< 1 week)")
    elif age_days < 30:
        print("  → ⚠️ New token (< 1 month)")
    else:
        print(f"  → Token has been live for {age_days} days")
    
    print("\n🚨 Risk Assessment:")
    print("-" * 30)
    print("• HIGH RISK: Contract not verified")
    print("• MEDIUM RISK: Owner not renounced")
    print("• CHECK: Liquidity status unknown")
    print("• CHECK: Trading volume unknown")
    
    return security_flags

def generate_summary():
    """Generate a summary of findings."""
    print("\n" + "=" * 60)
    print("                    ANALYSIS SUMMARY")
    print("=" * 60)
    
    print("""
Token: Diamondz Shadow Game + Movies (SDM)
Address: 0x602b869eEf1C9F0487F31776bad8Af3C4A173394
Network: Arbitrum

KEY FINDINGS:
-------------
1. Token was created on July 29, 2025
2. Total supply: 4,000,000,000 SDM
3. Contract is NOT verified on Arbiscan ⚠️
4. Owner has NOT renounced ownership ⚠️
5. Mint transaction confirmed and valid ✅

RECOMMENDATIONS:
----------------
1. Request contract verification from the team
2. Check for audit reports
3. Verify liquidity on DEXs before trading
4. Monitor holder distribution
5. Research the project's website and documentation
6. Check community sentiment on social media

⚠️ IMPORTANT: Always DYOR (Do Your Own Research) before investing
""")

def main():
    print("🔍 Advanced Token Analysis for SDM on Arbitrum")
    print("=" * 60)
    print(f"Starting analysis at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run analyses
    holders = get_token_holders()
    time.sleep(1)  # Rate limiting
    
    transfers = get_token_transfers()
    time.sleep(1)
    
    check_liquidity_pools()
    time.sleep(1)
    
    events = get_contract_events()
    time.sleep(1)
    
    security = analyze_token_security()
    
    generate_summary()
    
    # Save analysis
    analysis_data = {
        "timestamp": datetime.now().isoformat(),
        "token_address": TOKEN_ADDRESS,
        "holders_count": len(holders),
        "recent_transfers": len(transfers),
        "security_analysis": security
    }
    
    filename = f"token_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, "w") as f:
        json.dump(analysis_data, f, indent=2)
    
    print(f"\n📊 Analysis saved to: {filename}")

if __name__ == "__main__":
    main()