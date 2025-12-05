'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { initializeContract, checkIfInitialized } from '@/scripts/initialize-contract';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_MODULE_ADDRESS || '';

export default function InitializeContractPage() {
    const router = useRouter();
    const { account, isWalletConnected, connect, signAndSubmitTransaction } = useWallet();
    const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    // Check if connected wallet is the deployer
    const isDeployer = account?.address?.toLowerCase() === MODULE_ADDRESS.toLowerCase();

    const handleCheckInitialization = async () => {
        if (!account?.address) {
            toast.error('Please connect your wallet first');
            return;
        }

        setIsChecking(true);
        try {
            const initialized = await checkIfInitialized(account.address);
            setIsInitialized(initialized);

            if (initialized) {
                toast.success('✅ Contract is already initialized! Redirecting to admin login...');
                setTimeout(() => {
                    router.push('/auth/admin-login');
                }, 2000);
            } else {
                toast.info('Contract needs to be initialized');
            }
        } catch (error) {
            console.error('Error checking initialization:', error);
            toast.error('Failed to check initialization status');
            setIsInitialized(false);
        } finally {
            setIsChecking(false);
        }
    };

    const handleInitialize = async () => {
        if (!account?.address) {
            toast.error('Please connect your wallet first');
            return;
        }

        setIsInitializing(true);
        try {
            toast.info('Creating initialization transaction...');
            const transaction = await initializeContract(account.address);

            toast.info('Please approve the transaction in your Petra wallet...');
            const response = await signAndSubmitTransaction(transaction);

            console.log('✅ Transaction submitted:', response);
            toast.success('✅ Contract initialized successfully! Redirecting to admin login...');

            setIsInitialized(true);

            // Redirect to admin login after successful initialization
            setTimeout(() => {
                router.push('/auth/admin-login');
            }, 2000);
        } catch (error: any) {
            console.error('❌ Error initializing contract:', error);

            if (error?.message?.includes('RESOURCE_ALREADY_EXISTS') || error?.message?.includes('ERESOURCE_ALREADY_EXISTS')) {
                toast.success('✅ Contract is already initialized! Redirecting...');
                setIsInitialized(true);
                setTimeout(() => {
                    router.push('/auth/admin-login');
                }, 2000);
            } else if (error?.message?.includes('User rejected') || error?.message?.includes('rejected')) {
                toast.error('Transaction rejected by user');
            } else {
                toast.error(`Failed to initialize contract: ${error?.message || 'Unknown error'}`);
            }
        } finally {
            setIsInitializing(false);
        }
    };

    // Check initialization status when wallet connects
    useEffect(() => {
        if (isWalletConnected && account?.address && isInitialized === null) {
            handleCheckInitialization();
        }
    }, [isWalletConnected, account?.address]);

    // Show access denied if not the deployer
    if (isWalletConnected && !isDeployer) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center space-x-2">
                            <ShieldAlert className="h-6 w-6" />
                            <span>Access Denied</span>
                        </CardTitle>
                        <CardDescription>
                            Only the contract deployer can initialize the contract
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-semibold text-red-900">
                                        ❌ Unauthorized Wallet
                                    </p>
                                    <p className="text-xs text-red-700 mt-1">
                                        Your wallet is not authorized to initialize this contract.
                                    </p>
                                </div>
                                <div className="border-t border-red-200 pt-3">
                                    <p className="text-xs text-gray-600">
                                        <strong>Your Wallet:</strong>
                                    </p>
                                    <p className="text-xs font-mono text-gray-800 break-all mt-1">
                                        {account?.address}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600">
                                        <strong>Required Wallet (Contract Deployer):</strong>
                                    </p>
                                    <p className="text-xs font-mono text-gray-800 break-all mt-1">
                                        {MODULE_ADDRESS}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => router.push('/')}
                            variant="outline"
                            className="w-full"
                        >
                            Return to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isWalletConnected) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Initialize Contract</CardTitle>
                        <CardDescription>
                            Connect your deployer wallet to initialize the credential store
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-900">
                                        Deployer Wallet Required
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Only the wallet that deployed the contract can initialize it
                                    </p>
                                    <p className="text-xs font-mono text-gray-600 mt-2 break-all">
                                        Required: {MODULE_ADDRESS}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button onClick={connect} className="w-full">
                            Connect Wallet
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Initialize Contract</CardTitle>
                    <CardDescription>
                        Set up the credential store for your admin wallet
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Wallet Info */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Connected Wallet</h3>
                        <p className="text-xs text-muted-foreground font-mono break-all">
                            {account?.address}
                        </p>
                    </div>

                    {/* Initialization Status */}
                    {isInitialized !== null && (
                        <div className={`border rounded-lg p-4 ${isInitialized ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-start space-x-3">
                                {isInitialized ? (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-green-900">
                                                Contract Initialized ✅
                                            </p>
                                            <p className="text-xs text-green-700 mt-1">
                                                Your wallet is now the contract owner! You will be redirected to the admin login page.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-red-900">
                                                Not Initialized ⚠️
                                            </p>
                                            <p className="text-xs text-red-700 mt-1">
                                                The contract store doesn't exist yet. Click "Initialize Contract" below to create it.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* What Happens */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
                        <h3 className="text-sm font-semibold">What happens when you initialize?</h3>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Creates a CredentialStore at your wallet address</li>
                            <li>Sets your wallet as the contract owner</li>
                            <li>Allows you to authorize issuers (institutions)</li>
                            <li>Enables admin dashboard access</li>
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleCheckInitialization}
                            variant="outline"
                            disabled={isChecking || isInitializing}
                            className="flex-1"
                        >
                            {isChecking ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Checking...
                                </>
                            ) : (
                                'Check Status'
                            )}
                        </Button>

                        <Button
                            onClick={handleInitialize}
                            disabled={isInitializing || isInitialized === true || isChecking}
                            className="flex-1"
                        >
                            {isInitializing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Initializing...
                                </>
                            ) : isInitialized ? (
                                'Already Initialized'
                            ) : (
                                'Initialize Contract'
                            )}
                        </Button>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                                <p className="text-xs text-yellow-900">
                                    <strong>Important:</strong> Only initialize the contract once.
                                    The wallet that initializes the contract becomes the permanent owner.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
