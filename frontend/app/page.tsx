'use client';
import { ethers, Contract } from "ethers";
import AuctionCoinAbi from '../contracts/AuctionCoin.json';
import { useSigner } from '../model/SignerContext';
import { sign } from "crypto";


export default function Home() {
  const signer = useSigner();

  return (
    <div>test</div>
  )
}
