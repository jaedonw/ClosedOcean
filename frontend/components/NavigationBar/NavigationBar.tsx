'use client';
import { Navbar, Container, Nav, Button, NavItem, NavLink, NavbarBrand } from 'react-bootstrap';
import { useAddress, useConnectWallet, useSigner } from '../../model/SignerContext';
import './NavigationBar.css';
import { useState } from 'react';
import MintModal from '../MintModal/MintModal';
import CreateModal from '../CreateModal/CreateModal';
import { ethers } from 'ethers';

export default function NavigationBar() {
  const connectWallet = useConnectWallet();
  const address = useAddress();
  const signer = useSigner();
  const [showMintModal, setShowMintModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container className="justify-content-start">
          <NavbarBrand href="/" className="center-text flex-gap">
            <img
              alt=""
              src="/logo.png"
              width="50"
              height="50"
              className="d-inline-block align-top"
            />
            ClosedOcean
          </NavbarBrand>|
          <Container>
            <Nav>
              <NavItem>
                <NavLink href="/">Home</NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="/created">Created</NavLink>
              </NavItem>
            </Nav>
          </Container>
        </Container>
        <Container className="justify-content-end flex-gap">
          <Button disabled={!address} onClick={() => setShowCreateModal(true)}>Create</Button>
          <Button disabled={!address} onClick={() => setShowMintModal(true)}>Mint AUC</Button>
          {address ? address : <Button onClick={connectWallet}>Connect MetaMask</Button>}
        </Container>
      </Navbar>
      <MintModal show={showMintModal} handleClose={() => setShowMintModal(false)} />
      {signer && <CreateModal show={showCreateModal} handleClose={() => setShowCreateModal(false)} />}
    </>
  )
}
