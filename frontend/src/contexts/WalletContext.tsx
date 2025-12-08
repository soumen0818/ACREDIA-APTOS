'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    connectPetraWallet,
    disconnectPetraWallet,
    getPetraAccount,
    isPetraInstalled,
    signAndSubmitTransaction as petraSignAndSubmit
} from '@/lib/petraWallet';
import { supabase } from '@/lib/supabase';

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

            // Update wallet address in database if user is logged in
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && acc && acc.address) {
                    console.log('💾 Updating wallet address for user:', user.id);

                    // Check user role from metadata
                    const userRole = user.user_metadata?.role;

                    if (userRole === 'institution') {
                        // Update institution wallet address
                        const { error: updateError } = await supabase
                            .from('institutions')
                            .update({ wallet_address: acc.address })
                            .eq('auth_user_id', user.id);

                        if (updateError) {
                            console.error('Failed to update institution wallet:', updateError);
                        } else {
                            console.log('✅ Institution wallet address updated:', acc.address);
                        }
                    } else if (userRole === 'student') {
                        // Update student wallet address
                        const { error: updateError } = await supabase
                            .from('students')
                            .update({ wallet_address: acc.address })
                            .eq('auth_user_id', user.id);

                        if (updateError) {
                            console.error('Failed to update student wallet:', updateError);
                        } else {
                            console.log('✅ Student wallet address updated:', acc.address);
                        }
                    }
                }
            } catch (dbError) {
                console.error('Error updating database:', dbError);
                // Don't throw - wallet connection succeeded
            }
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

