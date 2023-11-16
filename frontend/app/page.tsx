'use client';
import { useSigner } from '../model/SignerContext';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import './globals.css'
import Auctions from '../components/Auctions/Auctions';
import Created from '../components/Created/Created';

export default function Home() {
  const signer = useSigner();

  return (
    <div className="page-border">
      <Tabs
        defaultActiveKey="auctions"
        className="mb-3"
        unmountOnExit={true}
      >
        <Tab eventKey="auctions" title="Auctions">
          {!signer && <div>Connect MetaMask wallet</div>}
          {signer && <Auctions />}
        </Tab>
        <Tab eventKey="created" title="Owned">
          {!signer && <div>Connect MetaMask wallet</div>}
          {signer && <Created />}
        </Tab>
      </Tabs>
    </div>
  )
}
