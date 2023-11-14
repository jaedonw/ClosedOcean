// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract AuctionHouse {
    event CollectionCreated(
        address indexed collection,
        address indexed owner,
        string name,
        string symbol
    );

    event ItemCreated(
        address indexed owner,
        uint256 indexed tokenId,
        string tokenURI
    );

    function createCollection(address owner, string memory name, string memory symbol) public {
        emit CollectionCreated(msg.sender, owner, name, symbol);
    }

    function createItem(address owner, uint256 tokenId, string memory tokenURI) public {
        emit ItemCreated(owner, tokenId, tokenURI);
    }

    /**
     * TODO
     */
    // function auctionItem(uint256 tokenId, uint256 price) public {
    //     require(price > 0, "Price must be greater than 0");

    // }

    // cancelAuction

    // endAuction

    // placeBid

    // claimItem

    // setFee

    // changeAdmin

    // withdrawFees

    // addManager

    // removeManager
}
