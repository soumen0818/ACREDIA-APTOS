'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallet as useAptosWallet } from '@aptos-labs/wallet-adapter-react';
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
    const aptosWallet = useAptosWallet();
    const [account, setAccount] = useState<{ address: string; publicKey: string } | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Wait for client-side mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Update account state when wallet connects/disconnects
    useEffect(() => {
        if (aptosWallet.connected && aptosWallet.account) {
            const accountInfo = {
                address: aptosWallet.account.address,
                publicKey: aptosWallet.account.publicKey?.toString() || '',
            };
            setAccount(accountInfo);
            console.log('✅ Wallet connected:', accountInfo);
        } else {
            // Only clear account if we were previously connected
            if (account !== null) {
                setAccount(null);
                console.log('🔌 Wallet disconnected');
            }
        }
    }, [aptosWallet.connected, aptosWallet.account]);

    const connect = async () => {
        setIsConnecting(true);
        try {
            // Get the Petra wallet from available wallets
            const petraWallet = aptosWallet.wallets?.find(w => w.name === 'Petra');

            if (!petraWallet) {
                throw new Error('Petra wallet not found. Please install Petra wallet extension.');
            }

            // Connect to the wallet - this will show the wallet popup
            await aptosWallet.connect(petraWallet.name);

            // Wait a bit for the connection to be established
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update wallet address in database if user is logged in
            if (aptosWallet.account?.address) {
                try {
                    const { data: { user }, error: authError } = await supabase.auth.getUser();

                    // Skip database update if no user is logged in or if there's an auth error
                    if (authError || !user) {
                        console.log('ℹ️ No authenticated user, skipping database update');
                        return;
                    }

                    console.log('💾 Updating wallet address for user:', user.id);

                    // Check user role from metadata
                    const userRole = user.user_metadata?.role;

                    if (userRole === 'institution') {
                        // Update institution wallet address
                        const { error: updateError } = await supabase
                            .from('institutions')
                            .update({ wallet_address: aptosWallet.account.address })
                            .eq('auth_user_id', user.id);

                        if (updateError) {
                            console.error('Failed to update institution wallet:', updateError);
                        } else {
                            console.log('✅ Institution wallet address updated:', aptosWallet.account.address);
                        }
                    } else if (userRole === 'student') {
                        // Update student wallet address
                        const { error: updateError } = await supabase
                            .from('students')
                            .update({ wallet_address: aptosWallet.account.address })
                            .eq('auth_user_id', user.id);

                        if (updateError) {
                            console.error('Failed to update student wallet:', updateError);
                        } else {
                            console.log('✅ Student wallet address updated:', aptosWallet.account.address);
                        }
                    }
                } catch (dbError) {
                    console.error('Error updating database:', dbError);
                }
            }
        } catch (error) {
            console.error('Connection failed:', error);
            throw error;
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = async () => {
        try {
            await aptosWallet.disconnect();
            setAccount(null);
        } catch (error) {
            console.error('Disconnection failed:', error);
            throw error;
        }
    };

    const signAndSubmitTransaction = async (transaction: any) => {
        if (!aptosWallet.signAndSubmitTransaction) {
            throw new Error('Wallet not connected');
        }

        // Submit transaction using the wallet adapter's expected format
        return await aptosWallet.signAndSubmitTransaction({
            sender: account?.address,
            data: {
                function: transaction.function,
                typeArguments: transaction.type_arguments || [],
                functionArguments: transaction.arguments || [],
            }
        });
    };

    return (
        <WalletContext.Provider
            value={{
                isWalletConnected: aptosWallet.connected && !!account,
                account,
                connect,
                disconnect,
                signAndSubmitTransaction,
                isLoading: isConnecting,
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

