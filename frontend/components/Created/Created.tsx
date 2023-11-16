'use client';
import { useAddress, useSigner } from '../../model/SignerContext';
import { Contract } from 'ethers';
import { useState, useEffect } from 'react';
import AuctionHouseAbi from '../../model/contracts/AuctionHouse.json';
import DigitalItemAbi from '../../model/contracts/DigitalItem.json';
import ItemCard from '../ItemCard/ItemCard';
import '../../app/globals.css'

const AuctionHouseAddress = process.env.auctionHouseAddress as string;

export default function Created() {
    const signer = useSigner();
    const address = useAddress();
    const [items, setItems] = useState<ItemTransfer[]>([]);

    const fetchItems = async () => {
        try {
            const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
            const filter = auctionHouse.filters.ItemTransfer(null, null, null, address, null);
            const events = await auctionHouse.queryFilter(filter);
            const items = events.map((event: any) => {
                const log = auctionHouse.interface.parseLog(event as any);
                if (log) {
                    return {
                        collection: log.args[0],
                        collectionLabel: '',
                        tokenId: parseInt(log.args[1], 18),
                        from: log.args[2],
                        to: log.args[3],
                        tokenUri: log.args[4],
                        metadata: null
                    };
                }
            });
            const ownedItems = [];
            for (let item of items) {
                if (item) {
                    const contract = new Contract(item.collection, DigitalItemAbi.abi, signer);
                    const owner = await contract.ownerOf(item.tokenId);
                    if (owner === address) {
                        const payload = item.tokenUri.split('ipfs://').pop();
                        const metadata = await fetch(`https://ipfs.io/ipfs/${payload}`).then(res => res.json());
                        metadata.image = `https://ipfs.io/ipfs/${metadata.image.split('ipfs://').pop()}`;
                        item.metadata = metadata;

                        const digitalItem = new Contract(item.collection, DigitalItemAbi.abi, signer);
                        const collectionName = await digitalItem.name();
                        const collectionSymbol = await digitalItem.symbol();
                        item.collectionLabel = `${collectionName} (${collectionSymbol})`;

                        ownedItems.push(item);
                    }
                }
            }

            const filteredItems = ownedItems.filter((item, index, self) =>
                index === self.findIndex((t) => (
                    t.collection === item.collection && t.tokenId === item.tokenId
                ))
            )

            setItems(filteredItems as any[]);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [])

    return (
        <div className="flex-container">
            {items.length > 0 ? items.map((item: ItemTransfer) => {
                return <ItemCard item={item} />
            }) : <div>No owned items.</div>}
        </div>
    )
}