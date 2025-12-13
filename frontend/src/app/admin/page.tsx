'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthorizeIssuer } from '@/components/institution/AuthorizeIssuer';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, Users, CheckCircle2, Award, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnectButton } from '@/components/shared/WalletConnectButton';
import { toast } from 'sonner';
import { getOwner, MODULE_ADDRESS } from '@/lib/aptos';

const CREDENTIAL_NFT_ABI = [
    {
        inputs: [],
        name: 'owner',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

interface AdminStats {
    totalInstitutions: number;
    authorizedInstitutions: number;
    totalCredentials: number;
    activeCredentials: number;
    totalStudents: number;
}

function AdminDashboardContent() {
    const router = useRouter();
    const { account } = useWallet();
    const [contractOwner, setContractOwner] = useState<string>('');
    const [isOwner, setIsOwner] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [stats, setStats] = useState<AdminStats>({
        totalInstitutions: 0,
        authorizedInstitutions: 0,
        totalCredentials: 0,
        activeCredentials: 0,
        totalStudents: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // Check if connected wallet is the contract owner
    useEffect(() => {
        const checkOwnership = async () => {
            if (!account?.address) {
                setIsOwner(false);
                setIsChecking(false);
                return;
            }

            try {
                setIsChecking(true);
                console.log('🔍 Checking contract owner...');
                console.log('Connected wallet:', account.address);

                const owner = await getOwner(MODULE_ADDRESS);
                console.log('Contract owner:', owner);

                setContractOwner(owner || '');

                // Normalize addresses for comparison
                const normalizedWallet = account.address.toLowerCase();
                const normalizedOwner = owner?.toLowerCase() || '';

                const isMatch = normalizedWallet === normalizedOwner;
                setIsOwner(isMatch);

                if (!isMatch) {
                    console.warn('❌ Wallet does not match contract owner');
                    toast.error('Access denied: Not the contract owner');
                } else {
                    console.log('✅ Contract owner verified');
                    toast.success('Contract owner verified');
                }
            } catch (error) {
                console.error('Error checking ownership:', error);
                toast.error('Failed to verify contract ownership');
                setIsOwner(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkOwnership();
    }, [account?.address]);

    // Fetch admin statistics
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoadingStats(true);
                const response = await fetch('/api/admin/stats');
                const data = await response.json();

                if (data.success) {
                    setStats(data.stats);
                    console.log('📊 Admin stats loaded:', data.stats);
                } else {
                    console.error('Failed to fetch stats:', data.error);
                    toast.error('Failed to load statistics');
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
                toast.error('Failed to load statistics');
            } finally {
                setLoadingStats(false);
            }
        };

        if (isOwner) {
            fetchStats();
            // Refresh stats every 30 seconds
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [isOwner]);

    // Prevent rendering if not owner
    if (isChecking) {
        return (
            <div className="min-h-screen bg-linear-to-br from-gray-50 via-teal-50 to-cyan-50 flex items-center justify-center">
                <Card className="p-8">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                        <p className="text-gray-600">Verifying contract owner...</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="min-h-screen bg-linear-to-br from-gray-50 via-teal-50 to-cyan-50 flex items-center justify-center">
                <Card className="p-8 max-w-md">
                    <Shield className="h-16 w-16 text-orange-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
                        Wallet Required
                    </h2>
                    <p className="text-gray-600 text-center mb-6">
                        Connect your wallet to verify contract ownership
                    </p>
                    <div className="flex flex-col space-y-3">
                        <WalletConnectButton />
                        <Link href="/">
                            <Button variant="outline" className="w-full">
                                <Home className="h-4 w-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    if (!isOwner) {
        return (
            <div className="min-h-screen bg-linear-to-br from-gray-50 via-teal-50 to-cyan-50 flex items-center justify-center">
                <Card className="p-8 max-w-lg border-red-200">
                    <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
                        Access Denied
                    </h2>
                    <p className="text-gray-600 text-center mb-4">
                        Only the contract owner can access the admin dashboard.
                    </p>

                    {/* Debug Info */}
                    <div className="bg-gray-100 rounded-lg p-4 mb-4 text-sm">
                        <p className="font-semibold text-gray-900 mb-2">Wallet Information:</p>
                        <div className="space-y-1 text-gray-700">
                            <p><strong>Connected Wallet:</strong></p>
                            <p className="font-mono text-xs break-all bg-white p-2 rounded">{account?.address}</p>
                            <p className="mt-2"><strong>Contract Owner:</strong></p>
                            <p className="font-mono text-xs break-all bg-white p-2 rounded">{contractOwner}</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 text-center mb-6">
                        Please connect the wallet that deployed the contracts.
                    </p>
                    <div className="space-y-2">
                        <WalletConnectButton />
                        <Link href="/">
                            <Button variant="outline" className="w-full">
                                <Home className="h-4 w-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 via-teal-50 to-cyan-50">
            {/* Navigation */}
            <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
                            <Image
                                src="/logo.png"
                                alt="Acredia Logo"
                                width={40}
                                height={40}
                                className="rounded-lg w-8 h-8 sm:w-10 sm:h-10"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-lg sm:text-2xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                    ACREDIA
                                </span>
                                <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-semibold">
                                    ADMIN
                                </span>
                            </div>
                        </Link>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <WalletConnectButton />
                            <Link href="/">
                                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-red-600">
                                    <Home className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                                    <span className="hidden sm:inline">Home</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Admin Dashboard Content */}
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                        <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                            Admin Dashboard
                        </h1>
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                        Manage institution authorizations and system settings
                    </p>
                </div>

                {/* Admin Info Card */}
                <Card className="border-red-200 bg-red-50 p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-red-900 mb-2">
                                ✅ Verified Contract Owner
                            </h3>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs sm:text-sm text-red-700 font-medium">Your Wallet Address:</p>
                                    <p className="text-xs font-mono text-red-800 break-all">
                                        {account.address}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-red-700 font-medium">Module Address:</p>
                                    <p className="text-xs font-mono text-red-800 break-all">
                                        {MODULE_ADDRESS}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6 bg-white border-gray-200 shadow-lg">
                        <div className="flex items-center space-x-3 mb-2">
                            <Users className="h-8 w-8 text-teal-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Total Institutions
                            </h3>
                        </div>
                        {loadingStats ? (
                            <div className="animate-pulse">
                                <div className="h-10 bg-gray-200 rounded w-16 mb-2"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-teal-600">
                                    {stats.totalInstitutions}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Registered institutions</p>
                            </>
                        )}
                    </Card>

                    <Card className="p-6 bg-white border-gray-200 shadow-lg">
                        <div className="flex items-center space-x-3 mb-2">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Authorized
                            </h3>
                        </div>
                        {loadingStats ? (
                            <div className="animate-pulse">
                                <div className="h-10 bg-gray-200 rounded w-16 mb-2"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-green-600">
                                    {stats.authorizedInstitutions}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Authorized to issue</p>
                            </>
                        )}
                    </Card>

                    <Card className="p-6 bg-white border-gray-200 shadow-lg">
                        <div className="flex items-center space-x-3 mb-2">
                            <Shield className="h-8 w-8 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Total Credentials
                            </h3>
                        </div>
                        {loadingStats ? (
                            <div className="animate-pulse">
                                <div className="h-10 bg-gray-200 rounded w-16 mb-2"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-3xl font-bold text-blue-600">
                                    {stats.totalCredentials}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {stats.activeCredentials} active, {stats.totalCredentials - stats.activeCredentials} revoked
                                </p>
                            </>
                        )}
                    </Card>
                </div>

                {/* Authorization Management */}
                <AuthorizeIssuer />
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    return <AdminDashboardContent />;
}