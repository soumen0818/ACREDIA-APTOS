'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, ArrowLeft, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnectButton } from '@/components/shared/WalletConnectButton';
import { getOwner, MODULE_ADDRESS } from '@/lib/aptos';
import { useState } from 'react';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
    const router = useRouter();
    const { account, isWalletConnected } = useWallet();
    const [isVerifying, setIsVerifying] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [contractOwner, setContractOwner] = useState<string>('');

    // Verify wallet ownership - only runs when user manually connects
    const handleVerifyOwnership = async () => {
        if (!account?.address) {
            toast.error('Please connect your wallet first');
            return;
        }

        try {
            setIsVerifying(true);
            const owner = await getOwner(MODULE_ADDRESS);
            setContractOwner(owner || '');

            console.log('🔍 Verification Details:');
            console.log('Your Wallet:', account.address);
            console.log('Contract Owner:', owner);
            console.log('Module Address:', MODULE_ADDRESS);

            const normalizedWallet = account.address.toLowerCase();
            const normalizedOwner = owner?.toLowerCase() || '';
            const isMatch = normalizedWallet === normalizedOwner;

            console.log('Normalized Wallet:', normalizedWallet);
            console.log('Normalized Owner:', normalizedOwner);
            console.log('Match:', isMatch);

            setIsOwner(isMatch);

            if (isMatch) {
                toast.success('✅ Contract owner verified! Redirecting...');
                setTimeout(() => {
                    router.push('/admin');
                }, 1500);
            } else {
                toast.error(`❌ Access denied: Not the contract owner\n\nYour wallet: ${account.address}\nContract owner: ${owner}`);
            }
        } catch (error: any) {
            console.error('Error verifying ownership:', error);

            // Check if the error is because the store doesn't exist
            if (error?.message?.includes('ESTORE_NOT_INITIALIZED') ||
                error?.message?.includes('RESOURCE_NOT_FOUND') ||
                error?.status === 404) {
                toast.error('⚠️ Contract not initialized! Please initialize the contract first.');
                // Redirect to initialization page after a delay
                setTimeout(() => {
                    router.push('/admin/initialize');
                }, 2000);
            } else {
                toast.error('Failed to verify contract ownership');
            }
            setIsOwner(false);
        } finally {
            setIsVerifying(false);
        }
    };

    // Auto-verify after wallet connection
    useEffect(() => {
        if (isWalletConnected && account?.address && !isVerifying && !isOwner) {
            handleVerifyOwnership();
        }
    }, [isWalletConnected, account?.address]);

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-red-50 to-orange-50 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 right-0 w-96 h-96 bg-red-200/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl"></div>
            </div>

            <Card className="w-full max-w-md p-8 space-y-6 relative z-10 shadow-2xl border-2 border-red-100">
                {/* Logo & Title */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="relative">
                            <Image
                                src="/logo.png"
                                alt="Acredia Logo"
                                width={80}
                                height={80}
                                className="rounded-lg"
                            />
                            <Shield className="absolute -bottom-2 -right-2 h-8 w-8 text-red-600 bg-white rounded-full p-1 shadow-lg" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Admin Portal
                    </h1>
                    <p className="text-gray-600">
                        Wallet-Based Access Only
                    </p>
                </div>

                {/* Verification Status */}
                {!isWalletConnected && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <Wallet className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">
                                    Connect Your Wallet
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Only the contract owner wallet can access the admin dashboard.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isWalletConnected && isVerifying && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mt-0.5"></div>
                            <div>
                                <p className="text-sm font-semibold text-yellow-900">
                                    Verifying Ownership...
                                </p>
                                <p className="text-xs text-yellow-700 mt-1">
                                    Checking if your wallet matches the contract owner.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isWalletConnected && !isVerifying && isOwner && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-green-900">
                                    ✅ Verified Contract Owner
                                </p>
                                <p className="text-xs text-green-700 mt-1">
                                    Redirecting to admin dashboard...
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isWalletConnected && !isVerifying && !isOwner && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-900">
                                    ❌ Access Denied
                                </p>
                                <p className="text-xs text-red-700 mt-1">
                                    Your wallet is not the contract owner. Only the owner can access admin features.
                                </p>
                                {contractOwner && (
                                    <p className="text-xs text-red-600 mt-2 font-mono break-all">
                                        Owner: {contractOwner}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Wallet Connection */}
                <div className="space-y-4">
                    <div className="flex flex-col items-center space-y-3">
                        <WalletConnectButton />
                        {isWalletConnected && account?.address && (
                            <p className="text-xs text-gray-500 text-center font-mono break-all">
                                {account.address}
                            </p>
                        )}
                    </div>
                </div>

                {/* Info Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">How it works:</h3>
                    <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                        <li>Connect your Aptos wallet (Petra, Martian, or OKX)</li>
                        <li>System verifies your wallet against the contract owner</li>
                        <li>If verified, you'll be redirected to the admin dashboard</li>
                        <li>No email or password required</li>
                    </ul>
                </div>

                {/* Contract Info */}
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-teal-900 mb-1">Contract Module</p>
                    <p className="text-xs font-mono text-teal-700 break-all">
                        {MODULE_ADDRESS}
                    </p>
                </div>

                {/* Back Link */}
                <div className="pt-2">
                    <Link href="/">
                        <Button
                            variant="ghost"
                            className="w-full text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
