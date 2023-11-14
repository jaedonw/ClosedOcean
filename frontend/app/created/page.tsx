'use client';
import { Container } from 'react-bootstrap';
import { useAddress, useSigner } from '../../model/SignerContext';
import './created.css';

export default function Owned() {
    const signer = useSigner();
    const address = useAddress();

    return (
        <>
            {(signer && address) ? (
                <Container>
                    
                </Container>
            ) : (
                <Container>
                    Connect MetaMask wallet
                </Container>
            )}
        </>
    )
}