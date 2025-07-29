// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC677} from "../interfaces/IERC677.sol";
import {IERC677Receiver} from "../interfaces/IERC677Receiver.sol";

/**
 * @title BurnMintERC677
 * @dev Implementation of the ERC677 token standard with burn and mint capabilities
 * Compatible with Chainlink CCIP for cross-chain token transfers
 * 
 * Key features:
 * - ERC677 transferAndCall functionality
 * - Burn and mint capabilities with role-based access control
 * - 4 billion token initial supply with 5 billion max supply cap
 * - Compatible with Chainlink's Cross-Chain Token (CCT) system
 * - Enhanced mint events for gamification and analytics
 */
contract BurnMintERC677 is ERC20, ERC20Burnable, IERC677, IERC165, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    error InvalidRecipient(address recipient);
    error InvalidMinter(address minter);
    error InvalidBurner(address burner);
    error MaxSupplyExceeded(uint256 supplyAfterMint);

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BurnerAdded(address indexed burner);
    event BurnerRemoved(address indexed burner);
    
    // Gamification and analytics events
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

    // Role management
    EnumerableSet.AddressSet private s_minters;
    EnumerableSet.AddressSet private s_burners;

    // Maximum supply cap (can be adjusted by owner)
    uint256 private s_maxSupply;
    
    // Tracking for gamification
    mapping(address => uint256) private s_totalMintedPerAddress;
    uint256 private s_totalMintEvents;

    // Initial supply: 4 billion tokens with 18 decimals
    uint256 public constant INITIAL_SUPPLY = 4_000_000_000 * 10**18;
    
    // Maximum supply: 5 billion tokens with 18 decimals
    uint256 public constant MAX_SUPPLY = 5_000_000_000 * 10**18;

    // Milestone threshold for gamification
    uint256 public constant MILESTONE_THRESHOLD = 100_000_000 * 10**18;

    /**
     * @dev Constructor initializes the token with name, symbol, and initial supply
     * @param name_ The name of the token
     * @param symbol_ The symbol of the token
     * @param initialAccount The account that receives the initial supply
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address initialAccount
    ) ERC20(name_, symbol_) {
        if (initialAccount == address(0)) revert InvalidRecipient(initialAccount);
        
        // Set max supply to 5 billion tokens
        s_maxSupply = MAX_SUPPLY;
        
        // Mint initial supply of 4 billion tokens
        _mint(initialAccount, INITIAL_SUPPLY);
        
        // Track initial mint for gamification
        s_totalMintedPerAddress[initialAccount] = INITIAL_SUPPLY;
        s_totalMintEvents = 1;
        
        // Emit initial mint event for analytics
        emit TokensMinted(
            address(this),
            initialAccount,
            INITIAL_SUPPLY,
            INITIAL_SUPPLY,
            block.timestamp
        );
        
        // Grant the deployer minter and burner roles initially
        s_minters.add(msg.sender);
        s_burners.add(msg.sender);
    }

    // ================================================================
    // |                        ERC677 Functions                      |
    // ================================================================

    /**
     * @dev Transfer tokens to a contract address with additional data
     * @param to The address to transfer to
     * @param amount The amount to be transferred
     * @param data The extra data to be passed to the receiving contract
     */
    function transferAndCall(
        address to,
        uint256 amount,
        bytes calldata data
    ) external override returns (bool success) {
        super.transfer(to, amount);
        emit Transfer(msg.sender, to, amount, data);
        
        if (_isContract(to)) {
            IERC677Receiver(to).onTokenTransfer(msg.sender, amount, data);
        }
        return true;
    }

    // ================================================================
    // |                     Minting Functions                        |
    // ================================================================

    /**
     * @dev Mints new tokens to a specific address
     * @param account The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address account, uint256 amount) external onlyMinter {
        _mintInternal(account, amount);
    }
    
    /**
     * @dev Special mint function for CCIP cross-chain mints with additional metadata
     * @param account The address to mint tokens to
     * @param amount The amount of tokens to mint
     * @param sourceChain The chain the tokens are coming from
     * @param ccipMessageId The CCIP message ID for tracking
     */
    function mintWithCCIPData(
        address account,
        uint256 amount,
        string calldata sourceChain,
        bytes32 ccipMessageId
    ) external onlyMinter {
        _mintInternal(account, amount);
        emit CrossChainMint(account, amount, sourceChain, ccipMessageId);
    }

    /**
     * @dev Internal helper function for minting logic shared between mint functions
     * @param account The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function _mintInternal(address account, uint256 amount) private {
        if (account == address(0)) revert InvalidRecipient(account);
        
        uint256 supplyAfterMint = totalSupply() + amount;
        if (supplyAfterMint > s_maxSupply) {
            revert MaxSupplyExceeded(supplyAfterMint);
        }
        
        _mint(account, amount);
        
        // Update gamification tracking
        s_totalMintedPerAddress[account] += amount;
        s_totalMintEvents++;
        
        // Emit detailed mint event for analytics/gamification
        emit TokensMinted(
            msg.sender,
            account,
            amount,
            supplyAfterMint,
            block.timestamp
        );
        
        // Check for milestones (every 100M tokens minted to an address)
        uint256 milestone = s_totalMintedPerAddress[account] / MILESTONE_THRESHOLD;
        uint256 previousMilestone = (s_totalMintedPerAddress[account] - amount) / MILESTONE_THRESHOLD;
        
        if (milestone > previousMilestone) {
            emit MintMilestone(
                account,
                s_totalMintedPerAddress[account],
                milestone * MILESTONE_THRESHOLD
            );
        }
    }

    /**
     * @dev Burns tokens from a specific address
     * @param account The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) public override onlyBurner {
        uint256 currentAllowance = allowance(account, msg.sender);
        if (currentAllowance != type(uint256).max) {
            _approve(account, msg.sender, currentAllowance - amount);
        }
        _burn(account, amount);
    }

    /**
     * @dev Burns tokens from the caller's address
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) public override onlyBurner {
        _burn(msg.sender, amount);
    }

    // ================================================================
    // |                    Access Control                            |
    // ================================================================

    /**
     * @dev Adds a new minter
     * @param minter The address to grant minting permission
     */
    function grantMintRole(address minter) external onlyOwner {
        if (minter == address(0)) revert InvalidMinter(minter);
        if (s_minters.add(minter)) {
            emit MinterAdded(minter);
        }
    }

    /**
     * @dev Removes a minter
     * @param minter The address to revoke minting permission
     */
    function revokeMintRole(address minter) external onlyOwner {
        if (s_minters.remove(minter)) {
            emit MinterRemoved(minter);
        }
    }

    /**
     * @dev Adds a new burner
     * @param burner The address to grant burning permission
     */
    function grantBurnRole(address burner) external onlyOwner {
        if (burner == address(0)) revert InvalidBurner(burner);
        if (s_burners.add(burner)) {
            emit BurnerAdded(burner);
        }
    }

    /**
     * @dev Removes a burner
     * @param burner The address to revoke burning permission
     */
    function revokeBurnRole(address burner) external onlyOwner {
        if (s_burners.remove(burner)) {
            emit BurnerRemoved(burner);
        }
    }

    /**
     * @dev Updates the maximum supply
     * @param newMaxSupply The new maximum supply
     */
    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        s_maxSupply = newMaxSupply;
    }

    // ================================================================
    // |                        View Functions                        |
    // ================================================================

    /**
     * @dev Checks if an address has minting permission
     * @param minter The address to check
     */
    function isMinter(address minter) public view returns (bool) {
        return s_minters.contains(minter);
    }

    /**
     * @dev Checks if an address has burning permission
     * @param burner The address to check
     */
    function isBurner(address burner) public view returns (bool) {
        return s_burners.contains(burner);
    }

    /**
     * @dev Returns the list of addresses with minting permission
     */
    function getMinters() public view returns (address[] memory) {
        return s_minters.values();
    }

    /**
     * @dev Returns the list of addresses with burning permission
     */
    function getBurners() public view returns (address[] memory) {
        return s_burners.values();
    }

    /**
     * @dev Returns the maximum supply
     */
    function maxSupply() public view returns (uint256) {
        return s_maxSupply;
    }

    /**
     * @dev Returns the number of decimals used by the token
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    /**
     * @dev Returns the total amount minted to a specific address
     * @param account The address to query
     */
    function totalMintedTo(address account) public view returns (uint256) {
        return s_totalMintedPerAddress[account];
    }
    
    /**
     * @dev Returns the total number of mint events
     */
    function totalMintEvents() public view returns (uint256) {
        return s_totalMintEvents;
    }

    // ================================================================
    // |                      ERC165 Support                          |
    // ================================================================

    /**
     * @dev Returns true if this contract implements the interface defined by interfaceId
     * @param interfaceId The interface identifier, as specified in ERC-165
     */
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return
            interfaceId == type(IERC20).interfaceId ||
            interfaceId == type(IERC677).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    // ================================================================
    // |                    Internal Functions                        |
    // ================================================================

    /**
     * @dev Checks if an address is a contract
     * @param addr The address to check
     */
    function _isContract(address addr) private view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }

    // ================================================================
    // |                      Modifiers                               |
    // ================================================================

    modifier onlyMinter() {
        if (!s_minters.contains(msg.sender)) revert InvalidMinter(msg.sender);
        _;
    }

    modifier onlyBurner() {
        if (!s_burners.contains(msg.sender)) revert InvalidBurner(msg.sender);
        _;
    }
}