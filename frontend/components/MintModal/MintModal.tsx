import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useState } from 'react';
import { Contract, formatUnits, parseUnits } from 'ethers';
import { useAddress, useSigner } from '../../model/SignerContext';
import AuctionCoinAbi from '../../model/contracts/AuctionCoin.json';
import '../../app/globals.css'

export default function MintModal({ show, handleClose }: { show: boolean, handleClose: () => void }) {
    const [amount, setAmount] = useState(0);
    const [balance, setBalance] = useState('0');
    const [loading, setLoading] = useState(false);
    const signer = useSigner();
    const address = useAddress();
    // TODO: remove hardcoded address
    const contract = new Contract('0x195438602ee98ca4D024E1d3dEcD4CB46e735DeD', AuctionCoinAbi.abi, signer);
    if (address) {
        contract.balanceOf(address).then((balance: any) => {
            contract.decimals().then((decimals: any) => {
                setBalance(formatUnits(balance, decimals));
            });
        });
    }

    const handleMint = async () => {
        setLoading(true);
        try {
            const tx = await contract.mint(parseUnits(amount.toString(), 18));
            await tx.wait();
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
        handleClose();
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
                <Modal.Title>Mint AUC</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h6>Balance: {balance} AUC</h6>
                <Form>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                        <Form.Label>Enter an amount of AUC to mint to your account.</Form.Label>
                        <Form.Control type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={loading}>
                    Close
                </Button>
                <Button variant="primary" type="submit" disabled={amount <= 0} onClick={handleMint} disabled={loading}>
                    Mint
                </Button>
            </Modal.Footer>
        </Modal>
    )
}