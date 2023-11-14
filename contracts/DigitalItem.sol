// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

/**
 * TODO
 */
contract DigitalItem is ERC721URIStorage {
    uint256 private nextTokenId;

    event ItemCreated(
        address indexed owner,
        uint256 indexed tokenId,
        string tokenURI
    );

    /**
     * TODO
     */
    constructor(
        string memory name,
        string memory symbol,
        address auctionHouse
    ) ERC721(name, symbol) {
        (bool success, bytes memory data) = auctionHouse.call(
            abi.encodeWithSignature(
                "createCollection(address,string,string)",
                msg.sender,
                name,
                symbol
            )
        );
        require(success, "AuctionHouse: createCollection failed");
    }

    /**
     * TODO
     */
    function createItem(string memory tokenURI) public {
        nextTokenId++;
        _safeMint(msg.sender, nextTokenId);
        _setTokenURI(nextTokenId, tokenURI);
        // items you've created and haven't listed yet or ones you've bought
        
    }
}
