// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console2} from "forge-std/Script.sol";
import {BurnMintERC677} from "../src/tokens/BurnMintERC677.sol";

contract DeployBurnMintERC677 is Script {
    function run() external {
        // Get deployment parameters from environment variables
        string memory tokenName = vm.envString("TOKEN_NAME");
        string memory tokenSymbol = vm.envString("TOKEN_SYMBOL");
        address initialAccount = vm.envAddress("INITIAL_ACCOUNT");
        
        // Start broadcast (signs and sends transactions)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the token
        BurnMintERC677 token = new BurnMintERC677(
            tokenName,
            tokenSymbol,
            initialAccount
        );
        
        console2.log("BurnMintERC677 deployed at:", address(token));
        console2.log("Token name:", tokenName);
        console2.log("Token symbol:", tokenSymbol);
        console2.log("Initial supply sent to:", initialAccount);
        console2.log("Total supply:", token.totalSupply());
        
        vm.stopBroadcast();
    }
}