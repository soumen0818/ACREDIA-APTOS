'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Building2, GraduationCap } from 'lucide-react';
import { signUp } from '@/lib/supabase';

type UserRole = 'institution' | 'student';

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roleParam = searchParams.get('role') as UserRole | null;

    const [role, setRole] = useState<UserRole>(roleParam || 'student');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate password match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        try {
            const { error } = await signUp(email, password, {
                data: {
                    name,
                    role,
                },
            });

            if (error) {
                setError(error.message);
                return;
            }

            // Show email confirmation message
            setError('');
            alert('✅ Registration successful!\n\n📧 Please check your email inbox and click the confirmation link to verify your account.\n\nNote: Check spam folder if you don\'t see the email.');
            // Redirect to login page
            router.push('/auth/login');
        } catch (err: any) {
            setError(err.message || 'An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-gray-200 bg-white shadow-2xl p-8">
                <div className="flex flex-col items-center mb-8">
                    <Image
                        src="/logo.png"
                        alt="Acredia Logo"
                        width={80}
                        height={80}
                        className="rounded-xl mb-4"
                    />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                    <p className="text-gray-600 text-center">
                        Join Acredia to manage your credentials
                    </p>
                </div>

                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                        type="button"
                        onClick={() => setRole('institution')}
                        aria-pressed={role === 'institution'}
                        className={`p-4 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ${role === 'institution'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-300 hover:border-slate-400 bg-white'
                            }`}
                    >
                        <Building2 className={`h-8 w-8 mx-auto mb-2 ${role === 'institution' ? 'text-blue-600' : 'text-slate-700'}`} />
                        <p className={`${role === 'institution' ? 'text-blue-700 font-medium' : 'text-slate-700 font-medium'}`}>Institution</p>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('student')}
                        aria-pressed={role === 'student'}
                        className={`p-4 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ${role === 'student'
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-300 hover:border-slate-400 bg-white'
                            }`}
                    >
                        <GraduationCap className={`h-8 w-8 mx-auto mb-2 ${role === 'student' ? 'text-blue-600' : 'text-slate-700'}`} />
                        <p className={`${role === 'student' ? 'text-blue-700 font-medium' : 'text-slate-700 font-medium'}`}>Student</p>
                    </button>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <Label htmlFor="name" className="text-gray-900">
                            {role === 'institution' ? 'Institution Name' : 'Full Name'}
                        </Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder={
                                role === 'institution'
                                    ? 'Harvard University'
                                    : 'John Doe'
                            }
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                        <Label htmlFor="email" className="text-gray-900">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    <div>
                        <Label htmlFor="password" className="text-gray-900">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                        <p className="text-gray-500 text-sm mt-1">
                            Minimum 8 characters
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword" className="text-gray-900">
                            Confirm Password
                        </Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={8}
                            className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Already have an account?{' '}
                        <Link
                            href="/auth/login"
                            className="text-teal-600 hover:text-teal-700 font-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                <div className="mt-4 text-center">
                    <Link
                        href="/"
                        className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                        ← Back to home
                    </Link>
                </div>
            </Card>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}