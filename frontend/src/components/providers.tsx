'use client';

import { AptosWalletProvider } from '@/contexts/AptosWalletProvider';
import { WalletProvider } from '@/contexts/WalletContext';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AptosWalletProvider>
            <WalletProvider>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </WalletProvider>
        </AptosWalletProvider>
    );
}
