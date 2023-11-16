// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./DigitalItem.sol";
import "./AuctionCoin.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract AuctionHouse is Ownable {
    struct Auction {
        uint256 price;
        uint256 endTime;
        address payable seller;
        address highestBidder;
    }

    event CollectionCreated(
        address indexed collection,
        address indexed owner,
        string name,
        string symbol
    );

    event ItemTransfer(
        address collection,
        uint256 tokenId,
        address indexed from,
        address indexed to,
        string tokenURI
    );

    // (collection, tokenId) => Auction
    mapping(address => mapping(uint256 => Auction)) public auctions;

    mapping(address => bool) public managers;

    address private auctionCoin;

    // default 2.5%
    uint256 public feePercentage = 25000000000000000;

    constructor(
        address auctionCoinAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        auctionCoin = auctionCoinAddress;
    }

    /**
     * TODO
     */
    function createCollection(
        address owner,
        string memory name,
        string memory symbol
    ) public {
        emit CollectionCreated(msg.sender, owner, name, symbol);
    }

    /**
     * TODO
     */
    function createItem(
        uint256 tokenId,
        address from,
        address to,
        string memory tokenURI
    ) public {
        emit ItemTransfer(msg.sender, tokenId, from, to, tokenURI);
    }

    /**
     * TODO
     */
    function auctionItem(
        address collection,
        uint256 tokenId,
        uint256 startPrice,
        uint endTime,
        string memory tokenURI,
        address seller
    ) public {
        require(startPrice > 0, "Price must be greater than 0");
        require(endTime > block.timestamp, "End time must be in the future");

        auctions[collection][tokenId] = Auction(
            startPrice,
            endTime,
            payable(seller),
            address(0)
        );

        emit ItemTransfer(collection, tokenId, seller, address(this), tokenURI);
    }

    function cancelAuction(address collection, uint256 tokenId) public {
        Auction memory auction = auctions[collection][tokenId];
        require(auction.seller == msg.sender, "Only seller can cancel auction");
        require(
            auction.highestBidder == address(0),
            "Cannot cancel auction if someone has already bid"
        );

        DigitalItem(collection).transferFrom(
            address(this),
            auction.seller,
            tokenId
        );
        delete auctions[collection][tokenId];

        emit ItemTransfer(
            collection,
            tokenId,
            address(this),
            auction.seller,
            DigitalItem(collection).tokenURI(tokenId)
        );
    }

    function lowerStartingPrice(
        address collection,
        uint256 tokenId,
        uint256 newPrice
    ) public {
        Auction memory auction = auctions[collection][tokenId];
        require(
            auction.seller == msg.sender,
            "Only seller can lower starting price"
        );
        require(
            newPrice < auction.price,
            "New price must be lower than current price"
        );
        require(newPrice > 0, "New price must be greater than 0");
        require(
            auction.highestBidder == address(0),
            "Cannot lower price if someone has already bid"
        );
        auctions[collection][tokenId].price = newPrice;
    }

    function placeBid(
        address collection,
        uint256 tokenId,
        uint256 bidAmount
    ) public {
        Auction memory auction = auctions[collection][tokenId];
        require(auction.endTime > block.timestamp, "Auction has ended");
        require(
            bidAmount > auction.price,
            "Bid must be greater than current price"
        );
        require(bidAmount > 0, "Bid must be greater than 0");

        if (auction.highestBidder != address(0)) {
            AuctionCoin(auctionCoin).transfer(
                auction.highestBidder,
                auction.price
            );
        }

        auctions[collection][tokenId].price = bidAmount;
        auctions[collection][tokenId].highestBidder = msg.sender;
    }

    function endAuction(address collection, uint256 tokenId) public {
        Auction memory auction = auctions[collection][tokenId];
        require(
            auction.highestBidder != address(0),
            "No bids have been placed"
        );
        require(msg.sender == auction.seller, "Only seller can end auction");

        uint256 fee = auction.price / (1000000000000000000 / feePercentage);
        AuctionCoin(auctionCoin).transfer(address(this), fee);
        AuctionCoin(auctionCoin).transfer(auction.seller, auction.price - fee);

        DigitalItem(collection).transferFrom(
            address(this),
            auction.highestBidder,
            tokenId
        );
        delete auctions[collection][tokenId];

        emit ItemTransfer(
            collection,
            tokenId,
            address(this),
            auction.highestBidder,
            DigitalItem(collection).tokenURI(tokenId)
        );
    }

    function claimItem(address collection, uint256 tokenId) public {
        Auction memory auction = auctions[collection][tokenId];
        require(
            auction.highestBidder == msg.sender,
            "Only highest bidder can claim item"
        );

        uint256 fee = auction.price / (1000000000000000000 / feePercentage);
        AuctionCoin(auctionCoin).transfer(auction.seller, auction.price - fee);
        AuctionCoin(auctionCoin).transfer(address(this), fee);

        DigitalItem(collection).transferFrom(
            address(this),
            auction.highestBidder,
            tokenId
        );
        delete auctions[collection][tokenId];

        emit ItemTransfer(
            collection,
            tokenId,
            address(this),
            auction.highestBidder,
            DigitalItem(collection).tokenURI(tokenId)
        );
    }

    function setFeePercentage(uint256 newFeePercentage) public {
        require(
            newFeePercentage <= 1000000000000000000,
            "Fee percentage must be less than or equal to 100%"
        );
        require(
            newFeePercentage >= 0,
            "Fee percentage must be greater than or equal to 0%"
        );
        require(
            msg.sender == owner() || managers[msg.sender],
            "Only owner or managers can set fee percentage"
        );
        feePercentage = newFeePercentage;
    }

    function toggleManager(address manager) public {
        require(msg.sender == owner(), "Only owner can toggle manager");
        managers[manager] = !managers[manager];
    }

    function withdrawFees() public {
        require(
            msg.sender == owner() || managers[msg.sender],
            "Only owner or managers can withdraw fees"
        );
        require(
            AuctionCoin(auctionCoin).balanceOf(address(this)) > 0,
            "No fees to withdraw"
        );
        AuctionCoin(auctionCoin).transfer(
            owner(),
            AuctionCoin(auctionCoin).balanceOf(address(this))
        );
    }
}
