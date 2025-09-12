// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DiamondzShadowGameMovies is ERC20, Ownable {
    constructor() ERC20("Diamondz Shadow Game + Movies", "SDM") {
        _mint(msg.sender, 4000000000 * 10 ** decimals());
    }
}