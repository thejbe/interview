"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Card } from '@/app/components/ui/Card';

export default function RecruiterLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            router.push('/recruiter');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md shadow-xl bg-[#152211]">
                <div className="flex justify-center mb-6">
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12"
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB6G5I5DigGispgUCJilH8SKOigJF9F4GwPxhdFnT4iVIq20ilMld6tKTCAMQ7moLT1dFiYBzFp9SC9x98H2srPIIAsKIPN8EWCJRcWCiRLPKO_hQBcx9HlT-3ngrvegSkW8LBDuerCHYCS4sDjg6yHNIE5eWJehBqEXLKfuzhJkVMlwfgf-dwqypT5LP1r50U9o43ShJAdo4IIn49t_ltQ95589W1cYQFslwtTdHanPPjGsVWAzF-zun5IUI0MRg3b4Tj3iwxONsZC")' }}>
                    </div>
                </div>

                <h1 className="text-white text-2xl font-bold text-center mb-8">Recruiter sign-in</h1>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <Input
                        label="Email address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Logging in...' : 'Log in as recruiter'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/manager/login" className="text-[#9fc992] hover:text-white text-sm transition-colors">
                        Are you a hiring manager? Log in here
                    </Link>
                </div>
            </Card>
        </div>
    );
}
