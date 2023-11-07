// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

/**
 * TODO
 */
contract DigitalItem is ERC721URIStorage {
    uint256 private _nextTokenId;

    /**
     * TODO
     */
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {}

    /**
     * TODO
     */
    function createItem(string memory tokenURI) public returns (uint256) {
        _nextTokenId++;
        _safeMint(msg.sender, _nextTokenId);
        _setTokenURI(_nextTokenId, tokenURI);
        return _nextTokenId;
    }
}
