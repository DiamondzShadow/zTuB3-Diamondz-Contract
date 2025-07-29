// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console2} from "forge-std/Test.sol";
import {BurnMintERC677} from "../src/tokens/BurnMintERC677.sol";
import {IERC677Receiver} from "../src/interfaces/IERC677Receiver.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC677} from "../src/interfaces/IERC677.sol";

contract MockERC677Receiver is IERC677Receiver {
    event TokensReceived(address sender, uint256 amount, bytes data);
    
    function onTokenTransfer(
        address sender,
        uint256 amount,
        bytes calldata data
    ) external override {
        emit TokensReceived(sender, amount, data);
    }
}

contract BurnMintERC677Test is Test {
    BurnMintERC677 public token;
    MockERC677Receiver public receiver;
    
    address public owner;
    address public alice;
    address public bob;
    address public minter;
    address public burner;
    
    uint256 public constant INITIAL_SUPPLY = 4_000_000_000 * 10**18;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value, bytes data);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BurnerAdded(address indexed burner);
    event BurnerRemoved(address indexed burner);
    
    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        minter = makeAddr("minter");
        burner = makeAddr("burner");
        
        // Deploy token with initial supply to owner
        token = new BurnMintERC677("Test Token", "TEST", owner);
        
        // Deploy mock receiver
        receiver = new MockERC677Receiver();
    }
    
    function test_InitialState() public {
        assertEq(token.name(), "Test Token");
        assertEq(token.symbol(), "TEST");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(token.maxSupply(), token.MAX_SUPPLY());
        assertTrue(token.isMinter(owner));
        assertTrue(token.isBurner(owner));
    }
    
    function test_TransferAndCall() public {
        bytes memory data = abi.encode("test data");
        uint256 amount = 1000 * 10**18;
        
        // Test transfer to EOA (should work like normal transfer)
        vm.expectEmit(true, true, false, true);
        emit Transfer(owner, alice, amount, data);
        
        bool success = token.transferAndCall(alice, amount, data);
        assertTrue(success);
        assertEq(token.balanceOf(alice), amount);
        
        // Test transfer to contract
        vm.expectEmit(true, true, false, true);
        emit Transfer(owner, address(receiver), amount, data);
        
        success = token.transferAndCall(address(receiver), amount, data);
        assertTrue(success);
        assertEq(token.balanceOf(address(receiver)), amount);
    }
    
    function test_MintingFunctionality() public {
        // Grant minter role
        vm.expectEmit(true, false, false, true);
        emit MinterAdded(minter);
        token.grantMintRole(minter);
        assertTrue(token.isMinter(minter));
        
        // Increase max supply to allow minting
        uint256 mintAmount = 1000 * 10**18;
        token.setMaxSupply(INITIAL_SUPPLY + mintAmount);
        
        // Mint tokens
        vm.prank(minter);
        token.mint(alice, mintAmount);
        
        assertEq(token.balanceOf(alice), mintAmount);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + mintAmount);
    }
    
    function test_BurningFunctionality() public {
        // Grant burner role
        vm.expectEmit(true, false, false, true);
        emit BurnerAdded(burner);
        token.grantBurnRole(burner);
        assertTrue(token.isBurner(burner));
        
        // Transfer tokens to burner
        uint256 burnAmount = 1000 * 10**18;
        token.transfer(burner, burnAmount);
        
        // Burn tokens
        vm.prank(burner);
        token.burn(burnAmount);
        
        assertEq(token.balanceOf(burner), 0);
        assertEq(token.totalSupply(), INITIAL_SUPPLY - burnAmount);
    }
    
    function test_BurnFrom() public {
        uint256 burnAmount = 1000 * 10**18;
        
        // Grant burner role
        token.grantBurnRole(burner);
        
        // Approve burner to burn owner's tokens
        token.approve(burner, burnAmount);
        
        // Burn from owner's account
        vm.prank(burner);
        token.burnFrom(owner, burnAmount);
        
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - burnAmount);
        assertEq(token.allowance(owner, burner), 0);
    }
    
    function test_MaxSupplyEnforcement() public {
        // First, mint up to the max supply limit
        uint256 maxSupply = token.MAX_SUPPLY();
        uint256 currentSupply = token.totalSupply();
        uint256 availableToMint = maxSupply - currentSupply;
        
        // Mint right up to the limit
        token.mint(alice, availableToMint);
        assertEq(token.totalSupply(), maxSupply);
        
        // Try to mint more than max supply
        uint256 exceedAmount = 1 * 10**18;
        
        vm.expectRevert(
            abi.encodeWithSelector(
                BurnMintERC677.MaxSupplyExceeded.selector,
                maxSupply + exceedAmount
            )
        );
        token.mint(alice, exceedAmount);
        
        // Increase max supply
        uint256 newMaxSupply = maxSupply + 1000 * 10**18;
        token.setMaxSupply(newMaxSupply);
        assertEq(token.maxSupply(), newMaxSupply);
        
        // Now minting should work
        token.mint(bob, exceedAmount);
        assertEq(token.balanceOf(bob), exceedAmount);
    }
    
    function test_RoleManagement() public {
        // Test adding and removing minter
        token.grantMintRole(alice);
        assertTrue(token.isMinter(alice));
        
        token.revokeMintRole(alice);
        assertFalse(token.isMinter(alice));
        
        // Test adding and removing burner
        token.grantBurnRole(bob);
        assertTrue(token.isBurner(bob));
        
        token.revokeBurnRole(bob);
        assertFalse(token.isBurner(bob));
    }
    
    function test_OnlyMinterCanMint() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                BurnMintERC677.InvalidMinter.selector,
                alice
            )
        );
        token.mint(bob, 100);
    }
    
    function test_OnlyBurnerCanBurn() public {
        token.transfer(alice, 1000);
        
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                BurnMintERC677.InvalidBurner.selector,
                alice
            )
        );
        token.burn(100);
    }
    
    function test_OnlyOwnerCanManageRoles() public {
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        token.grantMintRole(bob);
        
        vm.prank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        token.grantBurnRole(bob);
    }
    
    function test_GettersReturnCorrectValues() public {
        // Add multiple minters and burners
        address[] memory minters = new address[](3);
        minters[0] = alice;
        minters[1] = bob;
        minters[2] = minter;
        
        for (uint i = 0; i < minters.length; i++) {
            token.grantMintRole(minters[i]);
        }
        
        address[] memory actualMinters = token.getMinters();
        // Note: owner is already a minter
        assertEq(actualMinters.length, 4);
        
        address[] memory burners = new address[](2);
        burners[0] = alice;
        burners[1] = burner;
        
        for (uint i = 0; i < burners.length; i++) {
            token.grantBurnRole(burners[i]);
        }
        
        address[] memory actualBurners = token.getBurners();
        // Note: owner is already a burner
        assertEq(actualBurners.length, 3);
    }
    
    function test_SupportsInterface() public {
        // ERC165 interface
        assertTrue(token.supportsInterface(0x01ffc9a7));
        
        // ERC20 interface - type(IERC20).interfaceId
        assertTrue(token.supportsInterface(type(IERC20).interfaceId));
        
        // ERC677 interface - type(IERC677).interfaceId
        assertTrue(token.supportsInterface(type(IERC677).interfaceId));
        
        // Random interface (should return false)
        assertFalse(token.supportsInterface(0xdeadbeef));
    }
    
    function testFuzz_MintWithinMaxSupply(uint256 amount) public {
        // Set reasonable bounds for fuzzing
        amount = bound(amount, 1, 1000 * 10**18);
        
        // Increase max supply to accommodate
        token.setMaxSupply(INITIAL_SUPPLY + amount);
        
        // Mint should succeed
        token.mint(alice, amount);
        assertEq(token.balanceOf(alice), amount);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + amount);
    }
    
    function testFuzz_BurnReducesSupply(uint256 amount) public {
        // Set reasonable bounds for fuzzing
        amount = bound(amount, 1, INITIAL_SUPPLY);
        
        // Burn tokens
        token.burn(amount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - amount);
        assertEq(token.totalSupply(), INITIAL_SUPPLY - amount);
    }
}