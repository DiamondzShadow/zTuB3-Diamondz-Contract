#!/usr/bin/env python3
"""
Contract Verification Script for Arbiscan
Token: SDM (0x602b869eEf1C9F0487F31776bad8Af3C4A173394)
"""

import os
import json
import requests
import time
from web3 import Web3
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
ARBISCAN_API = "https://api.arbiscan.io/api"
ARBISCAN_API_KEY = os.getenv('ARBISCAN_API_KEY')
TOKEN_ADDRESS = "0x602b869eEf1C9F0487F31776bad8Af3C4A173394"
ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc"

if not ARBISCAN_API_KEY:
    print("⚠️  Error: ARBISCAN_API_KEY not found in environment variables.")
    print("   Please set it in your .env file or as an environment variable.")
    print("   Copy .env.example to .env and add your API key.")
    exit(1)

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(ARBITRUM_RPC))

def get_contract_creation_info():
    """Get contract creation transaction details."""
    print("📋 Fetching Contract Creation Information...")
    print("-" * 60)
    
    params = {
        "module": "contract",
        "action": "getcontractcreation",
        "contractaddresses": TOKEN_ADDRESS,
        "apikey": ARBISCAN_API_KEY
    }
    
    try:
        response = requests.get(ARBISCAN_API, params=params, timeout=10)
        data = response.json()
        
        if data["status"] == "1" and data["result"]:
            creation_info = data["result"][0]
            print(f"✅ Contract Creator: {creation_info['contractCreator']}")
            print(f"✅ Creation TX: {creation_info['txHash']}")
            return creation_info
        else:
            print("❌ Could not fetch creation info")
            # We know this from our previous analysis
            return {
                "contractCreator": "0xC5D133296E17BA25DF0409a6C31607bf3B78e3e3",
                "txHash": "0x1061de9e96b65cc62fabc748d972fefcf7cfc7fc9c518464855ac9744ef7d85d"
            }
    except Exception as e:
        print(f"Error: {e}")
        return None

def check_verification_status():
    """Check if contract is already verified."""
    print("\n🔍 Checking Current Verification Status...")
    print("-" * 60)
    
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
            if source.get("SourceCode"):
                print("✅ Contract is ALREADY VERIFIED!")
                print(f"   Contract Name: {source.get('ContractName', 'Unknown')}")
                print(f"   Compiler: {source.get('CompilerVersion', 'Unknown')}")
                print(f"   License: {source.get('LicenseType', 'Unknown')}")
                return True
            else:
                print("❌ Contract is NOT verified")
                return False
    except Exception as e:
        print(f"Error checking status: {e}")
        return False

def prepare_standard_erc20_source():
    """Prepare a standard ERC20 source code for verification attempt."""
    
    # Standard OpenZeppelin-style ERC20 implementation
    source_code = '''// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

contract ERC20 is Context, IERC20, IERC20Metadata {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        uint256 currentAllowance = _allowances[sender][_msgSender()];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, _msgSender(), currentAllowance - amount);
        }
        _transfer(sender, recipient, amount);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender] + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        uint256 currentAllowance = _allowances[_msgSender()][spender];
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(_msgSender(), spender, currentAllowance - subtractedValue);
        }
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal virtual {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _beforeTokenTransfer(sender, recipient, amount);

        uint256 senderBalance = _balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[sender] = senderBalance - amount;
        }
        _balances[recipient] += amount;

        emit Transfer(sender, recipient, amount);

        _afterTokenTransfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);

        _afterTokenTransfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        _beforeTokenTransfer(account, address(0), amount);

        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
        }
        _totalSupply -= amount;

        emit Transfer(account, address(0), amount);

        _afterTokenTransfer(account, address(0), amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual {}

    function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual {}
}

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(_msgSender());
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

contract DiamondzShadowGameMovies is ERC20, Ownable {
    constructor() ERC20("Diamondz Shadow Game + Movies", "SDM") {
        _mint(msg.sender, 4000000000 * 10 ** decimals());
    }
}'''
    
    return source_code

def submit_for_verification():
    """Submit contract for verification on Arbiscan."""
    print("\n📝 Preparing Verification Submission...")
    print("-" * 60)
    
    # Common compiler versions to try
    compiler_versions = [
        "v0.8.20+commit.a1b79de6",
        "v0.8.19+commit.7dd6d404",
        "v0.8.18+commit.87f61d96",
        "v0.8.17+commit.8df45f5f",
        "v0.8.9+commit.e5eed63a",
        "v0.8.7+commit.e28d00a7",
        "v0.8.4+commit.c7e474f2",
        "v0.8.0+commit.c7dfd78e"
    ]
    
    source_code = prepare_standard_erc20_source()
    
    print("\n⚠️  IMPORTANT NOTICE:")
    print("-" * 60)
    print("To verify this contract, you need:")
    print("1. The EXACT source code used to deploy it")
    print("2. The EXACT compiler version used")
    print("3. The EXACT compiler settings (optimization, etc.)")
    print("4. Any imported libraries or dependencies")
    print()
    print("Since you deployed this contract, you should have:")
    print("• The original Solidity source files")
    print("• The deployment configuration (hardhat.config.js, truffle-config.js, etc.)")
    print("• The compiler settings used")
    print()
    
    # Try to verify with standard settings
    for i, compiler in enumerate(compiler_versions[:3]):  # Try first 3 versions
        if i > 0:
            print("⏳ Waiting 3 seconds to avoid rate limit...")
            time.sleep(3)
            
        print(f"\n🔄 Attempting verification with compiler {compiler}...")
        
        params = {
            "module": "contract",
            "action": "verifysourcecode",
            "contractaddress": TOKEN_ADDRESS,
            "sourceCode": source_code,
            "codeformat": "solidity-single-file",
            "contractname": "DiamondzShadowGameMovies",
            "compilerversion": compiler,
            "optimizationUsed": "1",  # Try with optimization
            "runs": "200",  # Standard optimization runs
            "constructorArguements": "",  # No constructor arguments for basic ERC20
            "evmversion": "london",  # Try london EVM version
            "licenseType": "3",  # MIT license
            "apikey": ARBISCAN_API_KEY
        }
        
        try:
            response = requests.post(ARBISCAN_API, data=params, timeout=30)
            data = response.json()
            
            if data["status"] == "1":
                guid = data["result"]
                print(f"✅ Verification submitted! GUID: {guid}")
                
                # Check verification result
                time.sleep(5)  # Wait for processing
                check_result = check_verification_result(guid)
                if check_result:
                    return True
            else:
                print(f"❌ Submission failed: {data.get('result', 'Unknown error')}")
                
        except Exception as e:
            print(f"Error submitting: {e}")
    
    return False

def check_verification_result(guid):
    """Check the result of a verification submission."""
    print(f"\n🔍 Checking verification result for GUID: {guid}")
    
    params = {
        "module": "contract",
        "action": "checkverifystatus",
        "guid": guid,
        "apikey": ARBISCAN_API_KEY
    }
    
    max_attempts = 6
    for attempt in range(max_attempts):
        try:
            response = requests.get(ARBISCAN_API, params=params, timeout=10)
            data = response.json()
            
            if data["status"] == "1":
                print(f"✅ Verification SUCCESSFUL!")
                return True
            elif "Pending" in data.get("result", ""):
                print(f"⏳ Verification pending... (attempt {attempt + 1}/{max_attempts})")
                time.sleep(5)
            else:
                print(f"❌ Verification failed: {data.get('result', 'Unknown error')}")
                return False
                
        except Exception as e:
            print(f"Error checking result: {e}")
            
        time.sleep(5)
    
    return False

def provide_manual_verification_guide():
    """Provide instructions for manual verification."""
    print("\n" + "=" * 70)
    print("                 MANUAL VERIFICATION GUIDE")
    print("=" * 70)
    print()
    print("Since automatic verification requires the exact source code and")
    print("compiler settings, you'll need to verify manually on Arbiscan.")
    print()
    print("📋 STEP-BY-STEP INSTRUCTIONS:")
    print("-" * 40)
    print()
    print("1. Go to: https://arbiscan.io/verifyContract")
    print()
    print("2. Enter the following information:")
    print(f"   • Contract Address: {TOKEN_ADDRESS}")
    print("   • Compiler Type: Solidity (Single file)")
    print("   • Compiler Version: [Select the version you used]")
    print("   • Open Source License: MIT (or your chosen license)")
    print()
    print("3. Compiler Configuration:")
    print("   • Optimization: [Yes/No - as per your deployment]")
    print("   • Optimization Runs: [200 is standard]")
    print("   • EVM Version: [default or as configured]")
    print()
    print("4. Enter Contract Code:")
    print("   • Paste your COMPLETE Solidity source code")
    print("   • Include all imports (flattened)")
    print("   • Contract name must match exactly")
    print()
    print("5. Constructor Arguments:")
    print("   • If your contract had constructor parameters,")
    print("     encode them using https://abi.hashex.org/")
    print()
    print("6. Libraries:")
    print("   • Add any library addresses if used")
    print()
    print("7. Complete the CAPTCHA and submit")
    print()
    print("💡 TIPS FOR SUCCESSFUL VERIFICATION:")
    print("-" * 40)
    print("• Use Remix's 'Flatten' plugin to combine all files")
    print("• Check your deployment script for exact compiler version")
    print("• Match optimization settings EXACTLY")
    print("• Remove any comments that might cause issues")
    print("• Ensure contract name matches the deployed contract")
    print()
    print("🔧 COMMON TOOLS FOR FLATTENING:")
    print("-" * 40)
    print("• Remix IDE: Flattener plugin")
    print("• Hardhat: npx hardhat flatten")
    print("• Truffle: truffle-flattener")
    print("• Online: https://www.solt.tools/")
    print()
    print("📚 IF YOU USED A FRAMEWORK:")
    print("-" * 40)
    print("• Hardhat: npx hardhat verify --network arbitrum {TOKEN_ADDRESS}")
    print("• Truffle: truffle run verify Contract@{TOKEN_ADDRESS} --network arbitrum")
    print("• Foundry: forge verify-contract {TOKEN_ADDRESS} src/Contract.sol:Contract")
    print()
    print("Need your API key in the request: " + ARBISCAN_API_KEY)
    print()
    print("=" * 70)

def main():
    print("🚀 Arbiscan Contract Verification Tool")
    print("=" * 70)
    print(f"Token: SDM")
    print(f"Address: {TOKEN_ADDRESS}")
    print(f"Network: Arbitrum")
    print("=" * 70)
    
    # Check current status
    if check_verification_status():
        print("\n✅ Contract is already verified! No action needed.")
        return
    
    # Get creation info
    creation_info = get_contract_creation_info()
    
    print("\n" + "=" * 70)
    print("                    VERIFICATION OPTIONS")
    print("=" * 70)
    print()
    print("The contract is currently UNVERIFIED on Arbiscan.")
    print()
    print("To verify it, you have two options:")
    print()
    print("1. AUTOMATIC VERIFICATION (Limited)")
    print("   - We can try standard ERC20 templates")
    print("   - Success depends on matching exact code")
    print()
    print("2. MANUAL VERIFICATION (Recommended)")
    print("   - Use your original source code")
    print("   - Guaranteed to work if done correctly")
    print()
    
    # Provide manual guide
    provide_manual_verification_guide()
    
    print("\n🔄 ATTEMPTING AUTOMATIC VERIFICATION...")
    print("-" * 60)
    print("Note: This may not work if the contract uses custom code")
    print()
    
    # Try automatic verification
    if submit_for_verification():
        print("\n✅ SUCCESS! Contract has been verified!")
    else:
        print("\n❌ Automatic verification failed.")
        print("Please use the manual verification guide above.")
        print()
        print("Most likely reasons for failure:")
        print("• Contract uses different source code than standard ERC20")
        print("• Different compiler version or settings were used")
        print("• Contract has custom modifications or imports")

if __name__ == "__main__":
    main()