// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IERC677
 * @dev Interface for ERC677 token which extends ERC20 with transferAndCall
 */
interface IERC677 is IERC20 {
    /**
     * @dev Transfer tokens from sender to recipient and call a function on the recipient
     * @param to The address to transfer tokens to
     * @param amount The amount of tokens to transfer
     * @param data Additional data to pass to the recipient
     */
    function transferAndCall(
        address to,
        uint256 amount,
        bytes calldata data
    ) external returns (bool success);

    /**
     * @dev Emitted when a transferAndCall occurs
     */
    event Transfer(
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data
    );
}