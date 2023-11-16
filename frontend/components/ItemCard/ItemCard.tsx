import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import { Col, Form, Row } from 'react-bootstrap';
import { Contract, ethers } from 'ethers';
import AuctionHouseAbi from '../../model/contracts/AuctionHouse.json';
import DigitalItemAbi from '../../model/contracts/DigitalItem.json';
import { useAddress, useSigner } from '../../model/SignerContext';
import AuctionCoinAbi from '../../model/contracts/AuctionCoin.json';
import './ItemCard.css';
import disablePage from '@/app/utils';

const AuctionHouseAddress = process.env.auctionHouseAddress as string;
const AuctionCoinAddress = process.env.auctionCoinAddress as string;

declare global {
    interface ItemTransfer {
        collection: string;
        collectionLabel: string;
        tokenId: number;
        from: string;
        to: string;
        tokenUri: string;
        metadata: {
            image: string;
            name: string;
            description: string;
        };
    }

    interface Auction extends ItemTransfer {
        auctionInfo: {
            price: number;
            endTime: Date;
            seller: string;
            highestBidder: string;
        }
    }
}

export default function ItemCard({ item }: { item: ItemTransfer | Auction }) {
    const signer = useSigner();
    const address = useAddress();
    const isAuction = 'auctionInfo' in item;
    const highestBidder = isAuction && parseInt(item.auctionInfo.highestBidder) ? item.auctionInfo.highestBidder : 'N/A';
    const hasEnded = isAuction && new Date() >= item.auctionInfo.endTime;

    const handleAuction = async (event: any) => {
        disablePage(true);
        event.preventDefault();
        const price = ethers.parseUnits(event.target[0].value, 18);
        const endDateTime = ethers.parseUnits(new Date(`${event.target[1].value} ${event.target[2].value}`).getTime().toString(), 18);
        try {
            const itemContract = new Contract(item.collection, DigitalItemAbi.abi, signer);
            const tx = await itemContract.auctionItem(item.tokenId, price, endDateTime, item.tokenUri);
            await tx.wait();
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
        disablePage(false);
    };

    const handleBid = async (event: any) => {
        disablePage(true);
        event.preventDefault();
        const bid = parseFloat(event.target[0].value);

        if (bid <= (item as Auction).auctionInfo.price) {
            alert('Bid must be higher than current price');
            return;
        }
        try {
            const auctionCoin = new Contract(AuctionCoinAddress, AuctionCoinAbi.abi, signer);
            const balance = await auctionCoin.balanceOf(address);
            if (bid > parseFloat(ethers.formatUnits(balance, 18))) {
                alert('Insufficient funds');
                return;
            }
            const payment = await auctionCoin.transfer(AuctionHouseAddress, ethers.parseUnits(bid.toString(), 18));
            await payment.wait();

            const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
            const tx = await auctionHouse.placeBid(item.collection, item.tokenId, ethers.parseUnits(bid.toString(), 18));
            await tx.wait();
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
        disablePage(false);
    };

    const handleLowerPrice = async (event: any) => {
        disablePage(true);
        event.preventDefault();
        const newPrice = parseFloat(event.target[0].value);
        if (newPrice < (item as Auction).auctionInfo.price && newPrice > 0) {
            try {
                const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
                const tx = await auctionHouse.lowerStartingPrice(item.collection, item.tokenId, ethers.parseUnits(newPrice.toString(), 18));
                await tx.wait();
                window.location.reload();
            } catch (err) {
                console.error(err);
            }
        }
        disablePage(false);
    }

    const handleEnd = async () => {
        disablePage(true);
        try {
            const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
            const tx = await auctionHouse.endAuction(item.collection, item.tokenId);
            await tx.wait();
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
        disablePage(false);
    };

    const handleClaim = async () => {
        disablePage(true);
        try {
            const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
            const tx = await auctionHouse.claimItem(item.collection, item.tokenId);
            await tx.wait();
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
        disablePage(false);
    };

    const handleCancel = async () => {
        disablePage(true);
        try {
            const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
            const tx = await auctionHouse.cancelAuction(item.collection, item.tokenId);
            await tx.wait();
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
        disablePage(false);
    };

    const canBid = () => {
        return isAuction && new Date() < item.auctionInfo.endTime;
    }

    const canCancel = () => {
        return isAuction
            && new Date() < item.auctionInfo.endTime
            && address === item.auctionInfo.seller
            && !parseInt(item.auctionInfo.highestBidder);
    }

    const canLowerStartingPrice = () => {
        return isAuction
            && new Date() < item.auctionInfo.endTime
            && address === item.auctionInfo.seller
            && !parseInt(item.auctionInfo.highestBidder);
    }

    const canEnd = () => {
        return isAuction
            && new Date() < item.auctionInfo.endTime
            && address === item.auctionInfo.seller
            && !!parseInt(item.auctionInfo.highestBidder);
    }

    const canClaim = () => {
        return hasEnded && address === item.auctionInfo.highestBidder;
    }

    return (
        <>
            <Card style={{ width: '18rem' }}>
                <Card.Img variant="top" src={item.metadata.image} />
                <Card.Body>
                    {hasEnded &&
                        <Card.Title className="ended-message">
                            Auction has ended.
                        </Card.Title>
                    }
                    {hasEnded && highestBidder === 'N/A' && address === item.auctionInfo.seller &&
                        <Button className="mb-3" onClick={handleCancel}>Reclaim</Button>
                    }
                    {canClaim() &&
                        <Button className="mb-3" onClick={handleClaim}>Claim item</Button>
                    }
                    <Card.Title>{item.metadata.name}</Card.Title>
                    <Card.Text>
                        {item.metadata.description}
                    </Card.Text>
                    <Card.Text>
                        Collection: {item.collectionLabel}
                    </Card.Text>
                    {!isAuction && <Form onSubmit={handleAuction}>
                        <Form.Group className="mb-3">
                            <Form.Label>Starting price (AUC)</Form.Label>
                            <Form.Control id="price" type="number" step="any" required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Auction end date</Form.Label>
                            <Form.Control id="endDate" type="date" required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Auction end time</Form.Label>
                            <Form.Control id="endTime" type="time" required />
                        </Form.Group>
                        <Form.Group>
                            <Button variant="primary" type="submit">
                                Auction
                            </Button>
                        </Form.Group>
                    </Form>}
                    {isAuction &&
                        <>
                            <Card.Text>
                                Seller: {item.auctionInfo.seller}
                            </Card.Text>
                            <Card.Text>
                                Highest bidder: {highestBidder}
                            </Card.Text>
                            <Card.Text>
                                End time: {item.auctionInfo.endTime.toLocaleString()}
                            </Card.Text>
                            <Card.Text>
                                Current price: {item.auctionInfo.price} AUC
                            </Card.Text>
                        </>
                    }
                    {canBid() &&
                        <Form onSubmit={handleBid}>
                            <Row className="mb-3">
                                <Col >
                                    <Form.Control type="number" placeholder="AUC" step="any" required />
                                </Col>
                                <Col xs="auto">
                                    <Button type="submit">Bid</Button>
                                </Col>
                            </Row>
                        </Form>
                    }
                    {canLowerStartingPrice() &&
                        <Form onSubmit={handleLowerPrice}>
                            <Row className="mb-3">
                                <Col >
                                    <Form.Control type="number" placeholder="AUC" step="any" required />
                                </Col>
                                <Col xs="auto">
                                    <Button type="submit">Lower price</Button>
                                </Col>
                            </Row>
                        </Form>
                    }
                    {canCancel() &&
                        <Button className="mb-3" onClick={handleCancel}>Cancel auction</Button>
                    }
                    {canEnd() &&
                        <Button className="mb-3" onClick={handleEnd}>End auction</Button>
                    }
                </Card.Body>
            </Card>
        </>
    )
}