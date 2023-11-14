import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useEffect, useState } from 'react';
import { Contract, ContractFactory, formatUnits, parseUnits } from 'ethers';
import { useAddress, useSigner } from '../../model/SignerContext';
import DigitalItemAbi from '../../model/contracts/DigitalItem.json';
import AuctionHouseAbi from '../../model/contracts/AuctionHouse.json';
import '../../app/globals.css'

import { NFTStorage } from 'nft.storage';
import { Col, Container, Row } from 'react-bootstrap';
const NFT_STORAGE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGE2ZjQ3OUI2YmFiM0U5NEE5OGM3RWJjOWZDRjcxMzEyNmUxQ2MwMzEiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY5OTgzNjk5NjY3NCwibmFtZSI6IkNsb3NlZE9jZWFuMSJ9.h30pX6mDCw8OqU2-DEFDeyn2ibiWPXH08Sy_8wFbGtU';
const AuctionHouseAddress = '0x2bF7bA7e0e52dC60Cf586de1a3A84bbac9aF8F45';

interface Collection {
    contractAddress: string,
    name: string,
    symbol: string,
};

export default function CreateModal({ show, handleClose }: { show: boolean, handleClose: () => void }) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const signer = useSigner();
    const address = useAddress();
    const [loading, setLoading] = useState(false);

    const fetchCollections = async () => {
        try {
            const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
            const filter = auctionHouse.filters.CollectionCreated(null, address);
            const events = await auctionHouse.queryFilter(filter);
            const collections = events.map((event: any) => {
                const log = auctionHouse.interface.parseLog(event as any);
                if (log) {
                    return {
                        contractAddress: log.args[0],
                        name: log.args[2],
                        symbol: log.args[3]
                    };
                }
            });

            setCollections(collections as Collection[]);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchCollections();
    }, [])

    const handleCreate = async (event: any) => {
        event.preventDefault();
        setLoading(true);
        try {
            const contractAddress = event.target[0].value;
            const tokenData = {
                image: event.target[1].files[0],
                name: event.target[2].value,
                description: event.target[3].value,
            }
            const nftStorage = new NFTStorage({ token: NFT_STORAGE_KEY });
            const response = await nftStorage.store(tokenData)
            const contract = new Contract(contractAddress, DigitalItemAbi.abi, signer);
            const tx = await contract.createItem(response.url);
            await tx.wait();
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
        handleClose();
    }

    const handleCreateCollection = async (event: any) => {
        event.preventDefault();
        setLoading(true);
        try {
            const contractFactory = new ContractFactory(DigitalItemAbi.abi, DigitalItemAbi.bytecode, signer);
            const contract = await contractFactory.deploy(
                event.target[0].value,
                event.target[1].value,
                AuctionHouseAddress
            );
            await contract.waitForDeployment();
            fetchCollections();
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    return (
        <Modal
            show={show}
            onHide={handleClose}
            centered
            backdrop="static"
            keyboard={false}
            className={loading ? 'disabled' : ''}
        >
            <Modal.Header closeButton>
                <Modal.Title>Create Digital Item</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleCreateCollection}>
                    <p>No collections? Create one below!</p>
                    <Row className="mb-3">
                        <Form.Group as={Col} controlId="formName">
                            <Form.Label>Contract name</Form.Label>
                            <Form.Control type="text" placeholder="My collection name" required />
                        </Form.Group>
                        <Form.Group as={Col} controlId="formSymbol">
                            <Form.Label>Token symbol</Form.Label>
                            <Form.Control type="text" placeholder="MCN" required />
                        </Form.Group>
                    </Row>
                    <Button variant="primary" type="submit" className="mb-3" disabled={loading}>
                        Create collection
                    </Button>
                </Form>
            </Modal.Body>
            <Form onSubmit={handleCreate}>
                <Modal.Body>
                    <Form.Group controlId="formCollection" className="mb-3">
                        <Form.Label>Choose collection</Form.Label>
                        <Form.Select required>
                            {collections.map((collection: Collection) => {
                                return <option value={collection.contractAddress}>{collection.name} ({collection.symbol})</option>
                            })}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group controlId="formFile" className="mb-3">
                        <Form.Label>Upload media</Form.Label>
                        <Form.Control type="file" required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                        <Form.Label>Title</Form.Label>
                        <Form.Control type="text" placeholder="Title" required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                        <Form.Label>Description</Form.Label>
                        <Form.Control as="textarea" rows={2} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={loading}>
                        Close
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        Create item
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}