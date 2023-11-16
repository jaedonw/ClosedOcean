import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useEffect, useState } from 'react';
import { Contract, formatUnits, parseUnits } from 'ethers';
import { useAddress, useConnectWallet, useSigner } from '../../model/SignerContext';
import AuctionCoinAbi from '../../model/contracts/AuctionCoin.json';
import '../../app/globals.css'
import disablePage from '@/app/utils';

export default function MintModal({ show, handleClose }: { show: boolean, handleClose: () => void }) {
    const [amount, setAmount] = useState(0);
    const [balance, setBalance] = useState('0');
    const signer = useSigner();
    const address = useAddress();
    const connectWallet = useConnectWallet();
    // TODO: remove hardcoded address
    const contract = new Contract(process.env.auctionCoinAddress as string, AuctionCoinAbi.abi, signer);
    try {
        if (address) {
            contract.balanceOf(address).then((balance: any) => {
                contract.decimals().then((decimals: any) => {
                    setBalance(formatUnits(balance, decimals));
                });
            });
        }
    } catch (err) {
        console.error(err);
    }

    const handleMint = async () => {
        disablePage(true);
        try {
            const tx = await contract.mint(parseUnits(amount.toString(), 18));
            await tx.wait();
        } catch (err) {
            console.error(err);
        }
        disablePage(false);
        handleClose();
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
                <Modal.Title>Mint AUC</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h6>Balance: {balance} AUC</h6>
                <Form>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                        <Form.Label>Enter an amount of AUC to mint to your account.</Form.Label>
                        <Form.Control type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value as any)} />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" type="submit" disabled={amount <= 0} onClick={handleMint}>
                    Mint
                </Button>
            </Modal.Footer>
        </Modal>
    )
}