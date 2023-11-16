import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useEffect, useState } from 'react';
import { Contract, formatUnits, parseUnits } from 'ethers';
import { useAddress, useSigner } from '../../model/SignerContext';
import AuctionHouseAbi from '../../model/contracts/AuctionHouse.json';
import AuctionCoin from '../../model/contracts/AuctionCoin.json';
import '../../app/globals.css'
import { ethers } from 'ethers';
import disablePage from '@/app/utils';

const AuctionHouseAddress = process.env.auctionHouseAddress as string;
const AuctionCoinAddress = process.env.auctionCoinAddress as string;

export default function SettingsModal({ show, handleClose }: { show: boolean, handleClose: () => void }) {
    const signer = useSigner();
    const address = useAddress();
    const [isManager, setIsManager] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [fee, setFee] = useState('');
    const [adminAddress, setAdminAddress] = useState('');
    const [balance, setBalance] = useState('');

    const assessRole = async () => {
        try {
            const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);

            const userIsManager = await auctionHouse.managers(address)
            const adminAddress = await auctionHouse.owner();
            const userIsAdmin = adminAddress === address;
            setAdminAddress(adminAddress);
            setIsManager(userIsManager || userIsAdmin);
            setIsAdmin(userIsAdmin);

            const feeDecimal = formatUnits((await auctionHouse.feePercentage()), 18);
            const feePercent = (parseFloat(feeDecimal) * 100).toFixed(2);
            setFee(feePercent);

            const auctionCoin = new Contract(AuctionCoinAddress, AuctionCoin.abi, signer);
            const balance = await auctionCoin.balanceOf(AuctionHouseAddress);
            setBalance(ethers.formatUnits(balance, 18));
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        assessRole();
    }, [])

    const handleFeeChange = async (e: any) => {
        disablePage(true);
        try {
            e.preventDefault();
            const fee = parseFloat(e.target[0].value);
            if (fee < 0 || fee > 100) {
                alert('Fee must be between 0 and 100');
                return;
            }
            const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
            const tx = await auctionHouse.setFeePercentage(parseUnits((fee / 100).toString(), 18));
            await tx.wait();
            handleClose();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        disablePage(false);
    }

    const handleAdminChange = async (e: any) => {
        disablePage(true);
        try {
            e.preventDefault();
            const newAdminAddress = e.target[0].value;
            if (!ethers.isAddress(newAdminAddress)) {
                alert('Invalid address');
                return;
            }
            if (newAdminAddress === adminAddress) {
                alert('New admin address cannot be the same as the current admin address');
                return;
            }
            const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
            const tx = await auctionHouse.transferOwnership(newAdminAddress);
            await tx.wait();
            window.location.reload();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        disablePage(false);
    }

    const handleAddManager = async (e: any) => {
        disablePage(true);
        try {
            e.preventDefault();
            const newManagerAddress = e.target[0].value;
            if (!ethers.isAddress(newManagerAddress)) {
                alert('Invalid address');
                return;
            }
            const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
            const isManager = await auctionHouse.managers(newManagerAddress);
            if (isManager) {
                alert('Address is already a manager');
                return;
            }
            const tx = await auctionHouse.toggleManager(newManagerAddress);
            await tx.wait();
            window.location.reload();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        disablePage(false);
    }

    const handleRemoveManager = async (e: any) => {
        disablePage(true);
        try {
            e.preventDefault();
            const managerAddress = e.target[0].value;
            if (!ethers.isAddress(managerAddress)) {
                alert('Invalid address');
                return;
            }
            const auctionHouse = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
            const isManager = await auctionHouse.managers(managerAddress);
            if (!isManager) {
                alert('Address is not a manager');
                return;
            }
            const tx = await auctionHouse.toggleManager(managerAddress);
            await tx.wait();
            window.location.reload();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        disablePage(false);
    }

    const handleWithdraw = async () => {
        disablePage(true);
        try {
            // check if balance is greater than 0 by parsing the float
            const balanceFloat = parseFloat(balance);
            if (balanceFloat <= 0) {
                alert('Balance must be greater than 0');
                return;
            }
            const auctionCoin = new Contract(AuctionHouseAddress, AuctionHouseAbi.abi, signer);
            const tx = await auctionCoin.withdrawFees();
            await tx.wait();
            window.location.reload();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        disablePage(false);
    }

    return (
        <Modal
            show={show}
            onHide={handleClose}
            centered
            backdrop="static"
            keyboard={false}
        >
            <Modal.Header closeButton>
                <Modal.Title>Settings</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!isManager && !isAdmin &&
                    <div>No settings you can change.</div>
                }
                {isManager &&
                    <Form className="mb-3" onSubmit={handleFeeChange}>
                        <Form.Group className="mb-3">
                            <Form.Label>Auction fee (%)</Form.Label>
                            <Form.Control type="number" step="any" required placeholder={`Current: ${fee}%`} />
                        </Form.Group>
                        <Button type="submit">Save</Button>
                    </Form>}
                {isAdmin &&
                    <Form className="mb-3" onSubmit={handleAdminChange}>
                        <Form.Group className="mb-3">
                            <Form.Label>Change admin address</Form.Label>
                            <Form.Control type="text" required placeholder={`Current: ${adminAddress}`} />
                        </Form.Group>
                        <Button type="submit">Save</Button>
                    </Form>
                }
                {isAdmin &&
                    <Form className="mb-3" onSubmit={handleAddManager}>
                        <Form.Group className="mb-3">
                            <Form.Label>Add manager</Form.Label>
                            <Form.Control type="text" required placeholder="Manager address" />
                        </Form.Group>
                        <Button type="submit">Save</Button>
                    </Form>
                }
                {isAdmin &&
                    <Form className="mb-3" onSubmit={handleRemoveManager}>
                        <Form.Group className="mb-3">
                            <Form.Label>Remove manager</Form.Label>
                            <Form.Control type="text" required placeholder="Manager address"  />
                        </Form.Group>
                        <Button type="submit">Save</Button>
                    </Form>
                }
            </Modal.Body>
            {isManager && <Modal.Footer>
                <p>Total Fees: {balance} AUC</p>
                <Button onClick={() => handleWithdraw()}>Withdraw fees to admin address</Button>
            </Modal.Footer>}
        </Modal>
    )
}