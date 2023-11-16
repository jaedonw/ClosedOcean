// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./DigitalItem.sol";
import "./AuctionCoin.sol";

/// @title Auction House that allows users participate in English Auctions
/// @author Jaedon Wong
/// @notice This contract is used to manage auctions and collect fees
contract AuctionHouse is Ownable {
    /// @notice Auction struct that stores the price, end time, seller, and highest bidder of an auction
    struct Auction {
        uint256 price;
        uint256 endTime;
        address payable seller;
        address highestBidder;
    }

    /// @notice Emitted when a new collection is created
    event CollectionCreated(
        address indexed collection,
        address indexed owner,
        string name,
        string symbol
    );

    /// @notice Emitted when a new item is created
    event ItemTransfer(
        address collection,
        uint256 tokenId,
        address indexed from,
        address indexed to,
        string tokenURI
    );

    /// @notice Mapping of a specific item to its auction data
    mapping(address => mapping(uint256 => Auction)) public auctions;

    /// @notice Mapping of addresses to whether they are a manager
    mapping(address => bool) public managers;

    /// @notice Address of the Auction House Coin
    address private auctionCoin;

    /// @notice The fee percentage that is taken from each auction
    /// @dev Default is 2.5%. This represents 0.025
    uint256 public feePercentage = 25000000000000000;

    /// @notice Constructor: Sets the address of the Auction House Coin and the initial owner
    /// @param auctionCoinAddress The address of the Auction House Coin
    /// @param initialOwner The address of the initial owner
    constructor(
        address auctionCoinAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        auctionCoin = auctionCoinAddress;
    }

    /// @notice Records the creation of a new collection
    /// @dev Called by the Digital Item contract when a new collection is created
    /// @param owner The address of the owner of the collection
    /// @param name The name of the collection
    /// @param symbol The symbol of the collection
    function createCollection(
        address owner,
        string memory name,
        string memory symbol
    ) public {
        emit CollectionCreated(msg.sender, owner, name, symbol);
    }

    /// @notice Records the creation of a new item
    /// @dev Called by the Digital Item contract when a new item is created
    /// @param tokenId The ID of the ERC721 token
    /// @param from The address of the previous owner of the item (0x0 if new)
    /// @param to The address of the new owner of the item
    /// @param tokenURI The token URI of the ERC721 token
    function createItem(
        uint256 tokenId,
        address from,
        address to,
        string memory tokenURI
    ) public {
        emit ItemTransfer(msg.sender, tokenId, from, to, tokenURI);
    }

    /// @notice Records an item as being auctioned
    /// @dev Called by the Digital Item contract when an item is being auctioned
    /// @param collection The address of the collection
    /// @param tokenId The ID of the ERC721 token
    /// @param startPrice The starting price of the auction
    /// @param endTime The end time of the auction
    /// @param tokenURI The token URI of the ERC721 token
    /// @param seller The address of the seller of the item
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

    /// @notice Records an auction as cancelled
    /// @dev Emits event that the item has been transferred back to the seller
    /// @param collection The address of the collection
    /// @param tokenId The ID of the ERC721 token
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

    /// @notice Lowers the starting price of an auction
    /// @dev Auction must not have any bids
    /// @param collection The address of the collection
    /// @param tokenId The ID of the ERC721 token
    /// @param newPrice The new starting price of the auction
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

    /// @notice Places a bid on an auction
    /// @dev Calls Auction House Coin to complete the transfer of funds
    /// @param collection The address of the collection
    /// @param tokenId The ID of the ERC721 token
    /// @param bidAmount The amount of the bid
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

    /// @notice Ends an auction
    /// @dev Calls both Auction House Coin and Digital Item to complete the transfer of funds and item
    /// @param collection The address of the collection
    /// @param tokenId The ID of the ERC721 token
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

    /// @notice Claims an item after the auction has ended
    /// @dev Calls both Auction House Coin and Digital Item to complete the transfer of funds and item
    /// @param collection The address of the collection
    /// @param tokenId The ID of the ERC721 token
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

    /// @notice Sets the auction house fee
    /// @dev Only owner or managers can set the fee
    /// @param newFeePercentage The new fee percentage
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

    /// @notice Toggles whether an address is a manager
    /// @param manager The address of the manager
    function toggleManager(address manager) public {
        require(msg.sender == owner(), "Only owner can toggle manager");
        managers[manager] = !managers[manager];
    }

    /// @notice Withdraws the fees to the admin address
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
