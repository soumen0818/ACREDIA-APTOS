'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';
import { Shield, CheckCircle2 } from 'lucide-react';
import { buildAuthorizeIssuerTx, isIssuerAuthorized, getOwner, MODULE_ADDRESS } from '@/lib/aptos';

export function AuthorizeIssuer() {
    const { account, signAndSubmitTransaction } = useWallet();
    const [walletToAuthorize, setWalletToAuthorize] = useState('');
    const [isAuthorizing, setIsAuthorizing] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [contractOwner, setContractOwner] = useState<string>('');

    // Load contract owner on mount
    useEffect(() => {
        const loadOwner = async () => {
            try {
                const owner = await getOwner(MODULE_ADDRESS);
                if (owner) {
                    setContractOwner(owner);
                    console.log('📋 Contract owner loaded:', owner);
                }
            } catch (error) {
                console.error('Error loading contract owner:', error);
            }
        };
        loadOwner();
    }, []);

    const authorizeWallet = async () => {
        if (!account) {
            toast.error('Please connect your wallet first');
            return;
        }

        if (!walletToAuthorize) {
            toast.error('Please enter a wallet address to authorize');
            return;
        }

        if (!signAndSubmitTransaction) {
            toast.error('Wallet does not support transactions');
            return;
        }

        setIsAuthorizing(true);
        try {
            toast.loading('Authorizing on blockchain...', { id: 'authorize' });

            // Step 1: Authorize on blockchain
            const tx = buildAuthorizeIssuerTx(walletToAuthorize);
            console.log('📝 Transaction payload:', tx);

            const response = await signAndSubmitTransaction(tx as any);

            console.log('⛓️ Transaction submitted:', response.hash);
            toast.loading('Waiting for blockchain confirmation...', { id: 'authorize' });

            // Step 2: Update database to reflect authorization
            const dbResponse = await fetch('/api/admin/update-authorization', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: walletToAuthorize,
                    transactionHash: response.hash
                }),
            });

            const data = await dbResponse.json();
            if (data.success) {
                toast.success('Wallet authorized successfully on blockchain and database!', { id: 'authorize' });
                console.log('✅ Authorization complete:', data.message);
                console.log('📜 Transaction:', response.hash);
            } else {
                console.warn('⚠️ Blockchain authorized but database update failed:', data.error);
                toast.success('Blockchain authorization successful!', { id: 'authorize' });
            }

            // Check status after authorization
            await checkAuthorizationStatus(walletToAuthorize);
        } catch (error: any) {
            console.error('Error authorizing wallet:', error);
            toast.error(error.message || 'Failed to authorize wallet', { id: 'authorize' });
        } finally {
            setIsAuthorizing(false);
        }
    };

    const checkAuthorizationStatus = async (address?: string) => {
        const addressToCheck = address || walletToAuthorize;

        if (!addressToCheck) {
            toast.error('Please enter a wallet address to check');
            return;
        }

        setIsChecking(true);
        try {
            const authorized = await isIssuerAuthorized(addressToCheck, MODULE_ADDRESS);
            setIsAuthorized(authorized);

            if (authorized) {
                toast.success('✅ Wallet is authorized on blockchain');
            } else {
                toast.info('❌ Wallet is not authorized on blockchain');
            }
        } catch (error) {
            console.error('Error checking authorization:', error);
            toast.error('Failed to check authorization status');
        } finally {
            setIsChecking(false);
        }
    };

    const checkMyWallet = async () => {
        if (account?.address) {
            setWalletToAuthorize(account.address);
            await checkAuthorizationStatus(account.address);
        }
    };

    return (
        <Card className="p-6 bg-white border-gray-200 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-6 w-6 text-teal-600" />
                <h2 className="text-2xl font-bold text-gray-900">Authorize Issuer</h2>
            </div>

            <p className="text-gray-600 mb-6">
                Only authorized wallets can issue credentials. Use the contract owner wallet to authorize other wallets.
            </p>

            {/* Contract Owner Info */}
            {contractOwner && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">Contract Owner Address</p>
                    <p className="text-xs font-mono text-blue-700 break-all">
                        {contractOwner}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                        ⚠️ Only this wallet can authorize other institutions
                    </p>
                </div>
            )}

            {/* Current Wallet Check */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-teal-900 mb-1">Your Connected Wallet</p>
                        <p className="text-xs font-mono text-teal-700 break-all">
                            {account?.address || 'Not connected'}
                        </p>
                        {account?.address && contractOwner &&
                            account.address.toLowerCase() === contractOwner.toLowerCase() && (
                                <p className="text-xs text-green-600 mt-2 font-medium">
                                    👑 You are the Contract Owner - You can issue credentials and authorize others!
                                </p>
                            )}
                    </div>
                    <Button
                        onClick={checkMyWallet}
                        variant="outline"
                        size="sm"
                        disabled={!account || isChecking}
                        className="border-teal-600 text-teal-600 hover:bg-teal-50 ml-2"
                    >
                        {isChecking ? 'Checking...' : 'Check Status'}
                    </Button>
                </div>

                {isAuthorized !== null && (
                    <div className="mt-3 flex items-center space-x-2">
                        {isAuthorized ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium text-green-700">
                                    ✅ Authorized to issue credentials
                                </span>
                            </>
                        ) : (
                            <>
                                <Shield className="h-5 w-5 text-orange-600" />
                                <span className="text-sm font-medium text-orange-700">
                                    ❌ Not authorized - needs authorization
                                </span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Authorization Form */}
            <div className="space-y-4">
                <div>
                    <Label htmlFor="walletAddress">Wallet Address to Authorize</Label>
                    <Input
                        id="walletAddress"
                        placeholder="0x..."
                        value={walletToAuthorize}
                        onChange={(e) => setWalletToAuthorize(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Enter the wallet address that should be authorized to issue credentials
                    </p>
                </div>

                <div className="flex space-x-3">
                    <Button
                        onClick={authorizeWallet}
                        disabled={isAuthorizing || !walletToAuthorize || !account}
                        className="flex-1 bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                    >
                        {isAuthorizing ? 'Authorizing...' : 'Authorize Wallet'}
                    </Button>

                    <Button
                        onClick={() => checkAuthorizationStatus()}
                        disabled={isChecking || !walletToAuthorize}
                        variant="outline"
                        className="border-gray-300"
                    >
                        {isChecking ? 'Checking...' : 'Check Status'}
                    </Button>
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Important:</h3>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                    <li>You must be the <strong>contract owner</strong> to authorize other wallets</li>
                    <li>Contract owner: The wallet that deployed the CredentialNFT contract</li>
                    <li>After authorization, the wallet can issue credentials immediately</li>
                    <li>You can authorize multiple institution wallets</li>
                </ul>
            </div>
        </Card>
    );
}
