// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console2} from "forge-std/Test.sol";
import {BurnMintERC677} from "../src/tokens/BurnMintERC677.sol";

contract BurnMintERC677GamificationTest is Test {
    BurnMintERC677 public token;
    
    address public owner;
    address public alice;
    address public bob;
    address public minter;
    
    event TokensMinted(
        address indexed minter,
        address indexed recipient, 
        uint256 amount, 
        uint256 totalSupply,
        uint256 timestamp
    );
    event MintMilestone(
        address indexed recipient,
        uint256 totalMinted,
        uint256 milestoneReached
    );
    event CrossChainMint(
        address indexed recipient,
        uint256 amount,
        string sourceChain,
        bytes32 ccipMessageId
    );
    
    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        minter = makeAddr("minter");
        
        // Deploy token
        token = new BurnMintERC677("Gamified Token", "GAME", owner);
        
        // Grant minter role
        token.grantMintRole(minter);
        
        // Increase max supply for testing
        token.setMaxSupply(10_000_000_000 * 10**18);
    }
    
    function test_InitialMintEvent() public {
        // Check initial mint tracking
        assertEq(token.totalMintedTo(owner), token.INITIAL_SUPPLY());
        assertEq(token.totalMintEvents(), 1);
    }
    
    function test_MintEmitsGamificationEvents() public {
        uint256 mintAmount = 50_000_000 * 10**18;
        
        // Expect the TokensMinted event
        vm.expectEmit(true, true, false, true);
        emit TokensMinted(
            minter,
            alice,
            mintAmount,
            token.INITIAL_SUPPLY() + mintAmount,
            block.timestamp
        );
        
        vm.prank(minter);
        token.mint(alice, mintAmount);
        
        // Verify tracking
        assertEq(token.totalMintedTo(alice), mintAmount);
        assertEq(token.totalMintEvents(), 2); // Initial + this mint
    }
    
    function test_MintMilestoneEvent() public {
        uint256 firstMint = 60_000_000 * 10**18;
        uint256 secondMint = 50_000_000 * 10**18; // Total will be 110M, crossing 100M milestone
        
        // First mint - no milestone
        vm.prank(minter);
        token.mint(alice, firstMint);
        
        // Second mint - should trigger milestone
        vm.expectEmit(true, false, false, true);
        emit MintMilestone(
            alice,
            firstMint + secondMint,
            100_000_000 * 10**18
        );
        
        vm.prank(minter);
        token.mint(alice, secondMint);
        
        assertEq(token.totalMintedTo(alice), firstMint + secondMint);
    }
    
    function test_CrossChainMintFunction() public {
        uint256 amount = 1000 * 10**18;
        string memory sourceChain = "Ethereum";
        bytes32 messageId = keccak256("test-message-id");
        
        // Expect CrossChainMint event
        vm.expectEmit(true, false, false, true);
        emit CrossChainMint(alice, amount, sourceChain, messageId);
        
        // Also expect standard TokensMinted event
        vm.expectEmit(true, true, false, true);
        emit TokensMinted(
            minter,
            alice,
            amount,
            token.totalSupply() + amount,
            block.timestamp
        );
        
        vm.prank(minter);
        token.mintWithCCIPData(alice, amount, sourceChain, messageId);
        
        assertEq(token.balanceOf(alice), amount);
        assertEq(token.totalMintedTo(alice), amount);
    }
    
    function test_MultipleMilestones() public {
        uint256 largeAmount = 250_000_000 * 10**18; // Should trigger 100M and 200M milestones
        
        // Should emit milestone for 200M (the highest milestone reached)
        vm.expectEmit(true, false, false, true);
        emit MintMilestone(alice, largeAmount, 200_000_000 * 10**18);
        
        // Note: In current implementation, only one milestone event per mint
        // If you want multiple milestone events, you'd need to modify the contract
        
        vm.prank(minter);
        token.mint(alice, largeAmount);
        
        // Mint more to trigger 300M milestone
        uint256 additionalAmount = 60_000_000 * 10**18;
        
        vm.expectEmit(true, false, false, true);
        emit MintMilestone(
            alice,
            largeAmount + additionalAmount,
            300_000_000 * 10**18
        );
        
        vm.prank(minter);
        token.mint(alice, additionalAmount);
    }
    
    function test_TrackingMultipleAddresses() public {
        uint256 amount = 100 * 10**18;
        
        vm.startPrank(minter);
        token.mint(alice, amount);
        token.mint(bob, amount * 2);
        token.mint(alice, amount); // Alice gets more
        vm.stopPrank();
        
        assertEq(token.totalMintedTo(alice), amount * 2);
        assertEq(token.totalMintedTo(bob), amount * 2);
        assertEq(token.totalMintEvents(), 4); // Initial + 3 mints
    }
}