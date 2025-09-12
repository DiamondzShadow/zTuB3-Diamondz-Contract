// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DiamondzShadowGameMovies
 * @dev Simple ERC20 token with Ownable functionality
 * Total supply: 4,000,000,000 SDM tokens
 */
contract DiamondzShadowGameMovies is ERC20, Ownable {
    /**
     * @dev Constructor that mints the initial supply to the deployer
     */
    constructor() ERC20("Diamondz Shadow Game + Movies", "SDM") {
        _mint(msg.sender, 4000000000 * 10 ** decimals());
    }
}