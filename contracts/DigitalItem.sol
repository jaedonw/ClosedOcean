// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./AuctionHouse.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

/**
 * TODO
 */
contract DigitalItem is ERC721URIStorage {
    uint256 private nextTokenId;
    address private auctionHouse;

    /**
     * TODO
     */
    constructor(
        string memory name,
        string memory symbol,
        address auctionHouseAddress
    ) ERC721(name, symbol) {
        auctionHouse = auctionHouseAddress;
        AuctionHouse(auctionHouse).createCollection(msg.sender, name, symbol);
    }

    /**
     * TODO
     */
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

    function auctionItem(
        uint256 tokenId,
        uint256 startPrice,
        uint endTime,
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
