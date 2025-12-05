'use client';

import { WalletProvider } from '@/contexts/WalletContext';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WalletProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </WalletProvider>
    );
}
