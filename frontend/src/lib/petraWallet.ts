/**
 * Custom Petra Wallet Adapter
 * Integrates with window.aptos to provide Petra wallet functionality
 */

export interface PetraWalletAPI {
    connect: () => Promise<{ address: string; publicKey: string }>;
    disconnect: () => Promise<void>;
    signAndSubmitTransaction: (transaction: any) => Promise<any>;
    signMessage: (message: any) => Promise<any>;
    account: () => Promise<{ address: string; publicKey: string }>;
    network: () => Promise<string>;
    onAccountChange: (callback: (account: any) => void) => void;
    onNetworkChange: (callback: (network: any) => void) => void;
}

declare global {
    interface Window {
        aptos?: PetraWalletAPI;
        petra?: any;
    }
}

export function isPetraInstalled(): boolean {
    return typeof window !== 'undefined' && typeof window.aptos !== 'undefined';
}

export async function connectPetraWallet(): Promise<{ address: string; publicKey: string } | null> {
    if (!isPetraInstalled()) {
        throw new Error('Petra wallet is not installed');
    }

    try {
        const response = await window.aptos!.connect();
        console.log('✅ Petra connected:', response);
        return response;
    } catch (error) {
        console.error('❌ Petra connection failed:', error);
        throw error;
    }
}

export async function disconnectPetraWallet(): Promise<void> {
    if (!isPetraInstalled()) {
        return;
    }

    try {
        await window.aptos!.disconnect();
        console.log('✅ Petra disconnected');
    } catch (error) {
        console.error('❌ Petra disconnection failed:', error);
        throw error;
    }
}

export async function getPetraAccount(): Promise<{ address: string; publicKey: string } | null> {
    if (!isPetraInstalled()) {
        return null;
    }

    try {
        const account = await window.aptos!.account();
        return account;
    } catch (error) {
        // Silently return null if not connected - this is expected behavior
        return null;
    }
}

export async function signAndSubmitTransaction(transaction: any): Promise<any> {
    if (!isPetraInstalled()) {
        throw new Error('Petra wallet is not installed');
    }

    try {
        console.log('🔐 Signing transaction with Petra...');
        console.log('Transaction:', transaction);

        // Petra wallet expects the transaction payload wrapped in an object with 'payload' key
        const response = await window.aptos!.signAndSubmitTransaction({ payload: transaction });

        console.log('✅ Transaction submitted:', response);
        return response;
    } catch (error) {
        console.error('❌ Transaction failed:', error);
        throw error;
    }
}
