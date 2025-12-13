'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { Network } from '@aptos-labs/ts-sdk';
import { ReactNode } from 'react';

export function AptosWalletProvider({ children }: { children: ReactNode }) {
    const wallets = [new PetraWallet()];

    return (
        <AptosWalletAdapterProvider
            plugins={wallets}
            autoConnect={false}
            dappConfig={{
                network: Network.TESTNET,
            }}
            onError={(error) => {
                console.error('Wallet error:', error);
            }}
        >
            {children}
        </AptosWalletAdapterProvider>
    );
}
