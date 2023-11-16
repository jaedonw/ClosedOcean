"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { MetaMaskInpageProvider } from "@metamask/providers";

declare global {
    interface Window {
        ethereum?: MetaMaskInpageProvider
    }
}

const SignerContext = createContext<ethers.JsonRpcProvider>({} as any);
const ConnectWalletContext = createContext(() => { });
const AddressContext = createContext<string>('');

export function useSigner() {
    return useContext(SignerContext);
}

export function useConnectWallet() {
    return useContext(ConnectWalletContext);
}

export function useAddress() {
    return useContext(AddressContext);
}

export function SignerProvider({ children }: { children: React.ReactNode }) {
    const [signer, setSigner] = useState(null);
    const [address, setAddress] = useState('');

    async function connectWallet() {
        if (window.ethereum != null) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner()
                setSigner(signer as any);
                setAddress(await signer.getAddress());
            } catch (err) {
                console.error(err);
            }

            window.ethereum.on('accountsChanged', () => {
                window.location.reload();
            });

            window.ethereum.on('disconnect', () => {
                window.location.reload();
            });
        }
    }

    const checkForAccounts = async () => {
        if (window.ethereum != null) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const addresses = await provider.listAccounts();
            if (addresses.length > 0) {
                connectWallet();
            }
        }
    }

    useEffect(() => {   
        checkForAccounts();
    }, []);

    return (
        <SignerContext.Provider value={signer as any}>
            <ConnectWalletContext.Provider value={connectWallet}>
                <AddressContext.Provider value={address}>
                    {children}
                </AddressContext.Provider>
            </ConnectWalletContext.Provider>
        </SignerContext.Provider>
    )
}