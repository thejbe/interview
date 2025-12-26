"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { registerUser } from '@/app/recruiter/actions';
import { Card } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';

function RegisterForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams?.get('token');

    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial check
    // Initial validation moved to render logic or separate check
    if (!token && !error) {
        // Ideally redirect or show error in render, but for now just don't set state in effect
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!token) {
            setError('Missing invitation token.');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        const result = await registerUser(token, name, password);

        if (result.success) {
            router.push('/recruiter/login?registered=true');
        } else {
            setError(result.message || 'Registration failed');
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-white">
                <p className="text-red-400">Invalid Registration Link. Please check your email.</p>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-md shadow-xl bg-[#152211]">
            <div className="flex justify-center mb-6">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAtk02XUI2TjvCyvZJ55eiIaXagtiaUdmPVL8golyshCvOwCS99zCFsivZkCk1miLFdxIBEDjdqqALhfD7lEytt89hub5hDQ0XOjW3HYsW3KyI6mKR-tyW1VrVBDVeUmOX6a7HJOtyTGmHVfRqQi3lkOgwA612Kx7XV0BSqDr2v0Jar6NpELhRJ_GZywhEDHE822GsWriy4l4vNwCLPbA0uBek_pXak-Z4D1lBUtbO9q_SWEWgtOp7n4BZGzNhgpGFtkB8Tly_E6nt1")' }}>
                </div>
            </div>

            <h1 className="text-white text-2xl font-bold text-center mb-2">Join Your Team</h1>
            <p className="text-center text-gray-400 mb-8 text-sm">Complete your account registration</p>

            <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <Input
                    label="Full Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                />

                <Input
                    label="Create Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                />

                <Input
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                />

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <Button type="submit" fullWidth disabled={loading}>
                    {loading ? 'Creating Account...' : 'Complete Registration'}
                </Button>
            </form>
        </Card>
    );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#142210] p-4">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <RegisterForm />
            </Suspense>
        </div>
    );
}
