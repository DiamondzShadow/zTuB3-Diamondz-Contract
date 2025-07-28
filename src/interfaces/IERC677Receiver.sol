// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title IERC677Receiver
 * @dev Interface for contracts that can receive ERC677 token transfers
 */
interface IERC677Receiver {
    /**
     * @dev Called by an ERC677 token contract after a successful transfer
     * @param sender The address which initiated the transfer
     * @param amount The amount of tokens transferred
     * @param data Additional data passed from the sender
     */
    function onTokenTransfer(
        address sender,
        uint256 amount,
        bytes calldata data
    ) external;
}