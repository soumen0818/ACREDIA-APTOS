'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    connectPetraWallet,
    disconnectPetraWallet,
    getPetraAccount,
    isPetraInstalled,
    signAndSubmitTransaction as petraSignAndSubmit
} from '@/lib/petraWallet';

interface WalletContextType {
    isWalletConnected: boolean;
    account: { address: string; publicKey: string } | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    signAndSubmitTransaction: (transaction: any) => Promise<any>;
    isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [account, setAccount] = useState<{ address: string; publicKey: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Wait for client-side mount
    useEffect(() => {
        setMounted(true);

        // Check if already connected
        const checkConnection = async () => {
            if (isPetraInstalled()) {
                console.log('✅ Petra wallet detected');
                try {
                    const acc = await getPetraAccount();
                    if (acc) {
                        setAccount(acc);
                    }
                } catch (error) {
                    console.log('Not connected yet');
                }
            } else {
                console.log('❌ Petra wallet not detected');
            }
        };

        checkConnection();
    }, []);

    const connect = async () => {
        setIsLoading(true);
        try {
            const acc = await connectPetraWallet();
            setAccount(acc);
        } catch (error) {
            console.error('Connection failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const disconnect = async () => {
        setIsLoading(true);
        try {
            await disconnectPetraWallet();
            setAccount(null);
        } catch (error) {
            console.error('Disconnection failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signAndSubmitTransaction = async (transaction: any) => {
        return await petraSignAndSubmit(transaction);
    };

    return (
        <WalletContext.Provider
            value={{
                isWalletConnected: !!account,
                account,
                connect,
                disconnect,
                signAndSubmitTransaction,
                isLoading,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

/**
 * Hook to use wallet context
 */
export function useWalletContext() {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWalletContext must be used within WalletProvider');
    }
    return context;
}

/**
 * Re-export for compatibility
 * Usage: const { account, connect, disconnect, isWalletConnected } = useWallet();
 */
export function useWallet() {
    return useWalletContext();
}

