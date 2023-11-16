'use client';
import { useAddress, useSigner } from '../../model/SignerContext';
import { Contract } from 'ethers';
import { useState, useEffect } from 'react';
import AuctionHouseAbi from '../../model/contracts/AuctionHouse.json';
import DigitalItemAbi from '../../model/contracts/DigitalItem.json';
import ItemCard from '../ItemCard/ItemCard';
import '../../app/globals.css'
import { ethers } from 'ethers';

const AuctionHouseAddress = process.env.auctionHouseAddress as string;

export default function Auctions() {
    const signer = useSigner();
    const address = useAddress();
    const [auctions, setAuctions] = useState<Auction[]>([]);

    const fetchAuctions = async () => {
        try {
            const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
            const filter = auctionHouse.filters.ItemTransfer(null, null, null, AuctionHouseAddress, null);
            const events = await auctionHouse.queryFilter(filter);
            const auctions = events.map((event: any) => {
                const log = auctionHouse.interface.parseLog(event as any);
                if (log) {
                    return {
                        collection: log.args[0],
                        collectionLabel: '',
                        tokenId: parseInt(log.args[1], 18),
                        from: log.args[2],
                        to: log.args[3],
                        tokenUri: log.args[4],
                        metadata: null,
                        auctionInfo: {}
                    };
                }
            });
            const activeAuctions = [];
            // TODO: Filter duplicates
            for (let auction of auctions) {
                if (auction) {
                    const contract = new Contract(auction.collection, DigitalItemAbi.abi, signer);
                    const owner = await contract.ownerOf(auction.tokenId);
                    if (owner === AuctionHouseAddress) {
                        const payload = auction.tokenUri.split('ipfs://').pop();
                        const metadata = await fetch(`https://ipfs.io/ipfs/${payload}`).then(res => res.json());
                        metadata.image = `https://ipfs.io/ipfs/${metadata.image.split('ipfs://').pop()}`;
                        auction.metadata = metadata;

                        const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
                        const auctionInfo = await auctionHouse.auctions(auction.collection, auction.tokenId);
                        auction.auctionInfo = {
                            price: ethers.formatUnits(auctionInfo.price, 18),
                            endTime: new Date(parseInt(ethers.formatUnits(auctionInfo.endTime, 18)) as number),
                            seller: auctionInfo.seller,
                            highestBidder: auctionInfo.highestBidder
                        };

                        const digitalItem = new Contract(auction.collection, DigitalItemAbi.abi, signer);
                        const collectionName = await digitalItem.name();
                        const collectionSymbol = await digitalItem.symbol();
                        auction.collectionLabel = `${collectionName} (${collectionSymbol})`;

                        activeAuctions.push(auction);
                    }
                }
            }

            const filteredAuctions = activeAuctions.filter((item, index, self) =>
                index === self.findIndex((t) => (
                    t.collection === item.collection && t.tokenId === item.tokenId
                ))
            )

            setAuctions(filteredAuctions as any[]);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchAuctions();
    }, [])

    return (
        <>
            <h1 className="section-heading ">
                My Auctions
            </h1>
            <div className="flex-container">
                {auctions.some(auction => auction.auctionInfo.seller === address) ? (
                    auctions
                        .filter(auction => auction.auctionInfo.seller === address)
                        .map((auction: Auction) => (
                            <ItemCard item={auction} />
                        ))
                ) : (
                    <p>You have no active auctions.</p>
                )}
            </div>
            <br />
            <h1 className="section-heading">
                Public Auctions
            </h1>
            <div className="flex-container">
                {auctions.some(auction => auction.auctionInfo.seller !== address) ? (
                    auctions
                        .filter(auction => auction.auctionInfo.seller !== address)
                        .map((auction: Auction) => (
                            <ItemCard item={auction} />
                        ))
                ) : (
                    <p>There are no public auctions.</p>
                )}
            </div>
        </>
    )
}