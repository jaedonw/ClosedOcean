// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Auction House Coin
/// @author Jaedon Wong
/// @notice This coin is used as currency for the Auction House
contract AuctionCoin is ERC20 {

    /// @notice Constructor: Mints ‘initalSupply’ tokens to sender
    /// @dev ERC20 constructor is called with the name and symbol of the token
    /// @param initialSupply The amount of tokens to mint to sender
    constructor(uint256 initialSupply) ERC20("AuctionCoin", "AUC") {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Mints ‘amount’ tokens to sender
    /// @param amount The amount of tokens to mint to sender
    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}
