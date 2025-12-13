'use client';

import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CredentialUploadForm } from '@/components/institution/CredentialUploadForm';
import { IssuedCredentialsList } from '@/components/institution/IssuedCredentialsList';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut, Wallet, Upload, List, User, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnectButton } from '@/components/shared/WalletConnectButton';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { isIssuerAuthorized } from '@/lib/aptos';

import StudentCredentialsList from '@/components/student/StudentCredentialsList';

function DashboardContent() {
    const { user, userRole, signOut } = useAuth();
    const router = useRouter();
    const { account } = useWallet();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [institutionId, setInstitutionId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [checkingAuth, setCheckingAuth] = useState(false);

    // Fetch institution ID from database
    useEffect(() => {
        const fetchInstitutionId = async () => {
            if (!user || userRole !== 'institution') {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('institutions')
                    .select('id, wallet_address')
                    .eq('auth_user_id', user.id)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching institution:', error);
                    toast.error('Failed to load institution data');
                } else if (data) {
                    setInstitutionId(data.id);
                    console.log('✅ Institution loaded:', data.id);
                } else {
                    console.warn('No institution record found for user');
                    toast.warning('Institution record not found. Creating profile...');

                    // Try to create institution record
                    const { data: newInst, error: createError } = await supabase
                        .from('institutions')
                        .insert([{
                            auth_user_id: user.id,
                            email: user.email,
                            name: user.email?.split('@')[0] || 'Institution',
                        }])
                        .select('id')
                        .single();

                    if (createError) {
                        console.error('Error creating institution:', createError);
                        toast.error('Failed to create institution profile');
                    } else if (newInst) {
                        setInstitutionId(newInst.id);
                        toast.success('Institution profile created');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchInstitutionId();
    }, [user, userRole]);

    // Check authorization status from blockchain when wallet is connected
    useEffect(() => {
        const checkBlockchainAuthorization = async () => {
            if (!account?.address || userRole !== 'institution') {
                return;
            }

            setCheckingAuth(true);
            try {
                console.log('🔍 Checking blockchain authorization for:', account.address);
                const authorized = await isIssuerAuthorized(account.address);
                setIsAuthorized(authorized);
                console.log('✅ Blockchain authorization status:', authorized ? 'Authorized' : 'Not Authorized');

                // Update database to sync with blockchain state
                if (authorized) {
                    const { error } = await supabase
                        .from('institutions')
                        .update({ verified: true })
                        .eq('wallet_address', account.address);

                    if (error) {
                        console.error('Failed to update database verification status:', error);
                    }
                }
            } catch (error) {
                console.error('Error checking blockchain authorization:', error);
            } finally {
                setCheckingAuth(false);
            }
        };

        checkBlockchainAuthorization();
    }, [account?.address, userRole]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    const handleCredentialIssued = () => {
        setRefreshTrigger((prev) => prev + 1);
        toast.success('Credential list will refresh!');
    };

    // Get institution data from user metadata
    const institutionName = user?.user_metadata?.name || 'Institution';
    const institutionWallet = account?.address || '';

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
                            <span className="text-lg sm:text-2xl font-bold bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                                ACREDIA
                            </span>
                        </Link>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <WalletConnectButton />
                            <Button
                                onClick={handleSignOut}
                                variant="ghost"
                                size="sm"
                                className="text-gray-700 hover:text-red-600"
                            >
                                <LogOut className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Dashboard Content */}
            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        Welcome, {user?.user_metadata?.name || 'User'}
                    </h1>
                    <p className="text-gray-600 text-base sm:text-lg capitalize">
                        {userRole} Dashboard
                    </p>
                </div>

                {/* Institution Dashboard */}
                {userRole === 'institution' && (
                    <div className="space-y-6">
                        {/* Loading State */}
                        {!institutionId && (
                            <Card className="border-gray-200 bg-white shadow-lg p-6">
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                                    <p className="text-gray-600">Loading institution data...</p>
                                </div>
                            </Card>
                        )}

                        {/* Account Info Card */}
                        {institutionId && (
                            <Card className="border-gray-200 bg-white shadow-lg p-4 sm:p-6">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                                    Account Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="text-gray-900 font-medium">{user?.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Role</p>
                                        <p className="text-gray-900 font-medium capitalize">{userRole}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Authorization Status</p>
                                        <p className="text-gray-900 font-medium">
                                            {checkingAuth ? (
                                                <span className="flex items-center text-blue-600">
                                                    <Shield className="h-4 w-4 mr-1 animate-spin" />
                                                    Checking...
                                                </span>
                                            ) : !account ? (
                                                <span className="flex items-center text-gray-500">
                                                    <Shield className="h-4 w-4 mr-1" />
                                                    Connect Wallet First
                                                </span>
                                            ) : isAuthorized ? (
                                                <span className="flex items-center text-green-600">
                                                    <Shield className="h-4 w-4 mr-1" />
                                                    Authorized
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-red-600">
                                                    <Shield className="h-4 w-4 mr-1" />
                                                    Not Authorized
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Wallet Status</p>
                                        <p className="text-gray-900 font-medium">
                                            {account ? (
                                                <span className="text-teal-600">
                                                    Connected: {account.address.slice(0, 6)}...
                                                    {account.address.slice(-4)}
                                                </span>
                                            ) : (
                                                <span className="text-orange-600">Not Connected</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Authorization Warning */}
                        {institutionId && account && !isAuthorized && (
                            <Card className="border-red-200 bg-red-50 p-6">
                                <div className="flex items-start space-x-3">
                                    <Shield className="h-6 w-6 text-red-600 mt-1" />
                                    <div>
                                        <h3 className="text-lg font-bold text-red-900 mb-2">
                                            Authorization Required
                                        </h3>
                                        <p className="text-red-800 mb-4">
                                            Your institution needs to be authorized by the admin to issue credentials.
                                            Please contact the administrator to authorize your wallet address: <strong>{account.address}</strong>
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Wallet Connection Warning */}
                        {institutionId && !account && (
                            <Card className="border-orange-200 bg-orange-50 p-6">
                                <div className="flex items-start space-x-3">
                                    <Wallet className="h-6 w-6 text-orange-600 mt-1" />
                                    <div>
                                        <h3 className="text-lg font-bold text-orange-900 mb-2">
                                            Connect Your Wallet
                                        </h3>
                                        <p className="text-orange-800 mb-4">
                                            You need to connect your wallet to issue credentials on the blockchain.
                                            Click the "Connect Wallet" button in the top right corner.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Tabs for Issue and View */}
                        {institutionId && (
                            <Tabs defaultValue="issue" className="w-full">
                                <TabsList className="grid w-full max-w-2xl grid-cols-2">
                                    <TabsTrigger value="issue" className="flex items-center space-x-2">
                                        <Upload className="h-4 w-4" />
                                        <span>Issue Credential</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="view" className="flex items-center space-x-2">
                                        <List className="h-4 w-4" />
                                        <span>View Issued</span>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="issue" className="mt-6">
                                    <CredentialUploadForm
                                        institutionId={institutionId}
                                        institutionName={institutionName}
                                        institutionWallet={institutionWallet}
                                        account={account}
                                        onSuccess={handleCredentialIssued}
                                    />
                                </TabsContent>

                                <TabsContent value="view" className="mt-6">
                                    <IssuedCredentialsList
                                        institutionId={institutionId}
                                        refreshTrigger={refreshTrigger}
                                    />
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                )}

                {/* Student Dashboard */}
                {userRole === 'student' && (
                    <div className="space-y-6">
                        {/* Account Info Card */}
                        <Card className="border-gray-200 bg-white shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Account Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="text-gray-900 font-medium">{user?.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Name</p>
                                    <p className="text-gray-900 font-medium">{user?.user_metadata?.name || 'Not set'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Wallet Status</p>
                                    <p className="text-gray-900 font-medium">
                                        {account ? (
                                            <span className="text-teal-600">
                                                Connected: {account.address.slice(0, 6)}...
                                                {account.address.slice(-4)}
                                            </span>
                                        ) : (
                                            <span className="text-orange-600">Not Connected</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Wallet Connection Warning */}
                        {!account && (
                            <Card className="border-orange-200 bg-orange-50 p-6">
                                <div className="flex items-start space-x-3">
                                    <Wallet className="h-6 w-6 text-orange-600 mt-1" />
                                    <div>
                                        <h3 className="text-lg font-bold text-orange-900 mb-2">
                                            Connect Your Wallet
                                        </h3>
                                        <p className="text-orange-800 mb-4">
                                            You need to connect your wallet to view your credentials on the blockchain.
                                            Click the "Connect Wallet" button in the top right corner.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Student Credentials List */}
                        <StudentCredentialsList
                            studentId={user?.id || ''}
                            studentWallet={account?.address}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
