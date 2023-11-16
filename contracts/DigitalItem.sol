// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./AuctionHouse.sol";

/// @title Digital Item that can be bought and sold on the Auction House
/// @author Jaedon Wong
/// @notice This contract is used to create collections and items that can be sold on the Auction House
contract DigitalItem is ERC721URIStorage {
    /// @notice The next token ID to be minted
    uint256 private nextTokenId;
    /// @notice The address of the Auction House
    address private auctionHouse;

    /// @notice Constructor: Creates a new ERC721 token (i.e. collection) with the given name and symbol
    /// @dev Calls the Auction House to emit an event that a new collection has been created
    /// @param name The name of the ERC721 token
    /// @param symbol The symbol of the ERC721 token
    /// @param auctionHouseAddress The address of the Auction House
    constructor(
        string memory name,
        string memory symbol,
        address auctionHouseAddress
    ) ERC721(name, symbol) {
        auctionHouse = auctionHouseAddress;
        AuctionHouse(auctionHouse).createCollection(msg.sender, name, symbol);
    }

    /// @notice Creates a new item with the given token URI
    /// @dev Mints a new ERC721 token (i.e. item) and calls the Auction House to emit an event that a new item has been created
    /// @param tokenURI The token URI of the ERC721 token
    function createItem(string memory tokenURI) public {
        _safeMint(msg.sender, nextTokenId);
        _setTokenURI(nextTokenId, tokenURI);
        AuctionHouse(auctionHouse).createItem(
            nextTokenId,
            address(0),
            msg.sender,
            tokenURI
        );
        nextTokenId++;
    }

    /// @notice Notifies the Auction House that this item is being auctioned
    /// @dev Transfers the item to the Auction House and calls the Auction House to emit an event that this item is being auctioned
    /// @param tokenId The ID of the ERC721 token
    /// @param startPrice The starting price of the auction
    /// @param endTime The end time of the auction
    /// @param tokenURI The token URI of the ERC721 token
    function auctionItem(
        uint256 tokenId,
        uint256 startPrice,
        uint256 endTime,
        string memory tokenURI
    ) public {
        AuctionHouse(auctionHouse).auctionItem(
            address(this),
            tokenId,
            startPrice,
            endTime,
            tokenURI,
            ownerOf(tokenId)
        );
        transferFrom(msg.sender, auctionHouse, tokenId);
    }
}
