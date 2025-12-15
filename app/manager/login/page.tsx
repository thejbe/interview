"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Card } from '@/app/components/ui/Card';

export default function ManagerLoginPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();
    const supabase = createClient();

    // For testing convenience, we might want to allow password login too if role logic is complex,
    // but requirements say "magic link".

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/manager/availability`,
                },
            });

            if (error) {
                throw error;
            }

            setMessage({ type: 'success', text: 'Check your email for the login link!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md shadow-xl bg-[#152211]">
                <div className="flex justify-center mb-6">
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12"
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCCmoIGdqE80auShoJkDGChmIB4DrOf1IQ0vaFKYOX7AGKphgefGV5o-2LwMCjrItNsnJy1wKzzfgGD25f1CHnl5CeVQD9OaHcHkMMypsWJDefUG1ErFL2v3V-HDDv_ZmoIUKruZ7dxlLP2nX4b4ZcVm7pC-oPjWUWlplrpfj40cSyERHXfWwdpVz8ymc-akLciztsma1YcpvdyorMNWtwe_8_X0dJyVXygwPfSlllbDL_JcsPabxqKBUUESoRfj4-MU1VZ19vPLjGW")' }}>
                    </div>
                </div>

                <h1 className="text-white text-2xl font-bold text-center mb-2">Hiring Manager Access</h1>
                <p className="text-[#9fc992] text-center mb-8 text-sm">Enter your email to receive a magic login link</p>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <Input
                        label="Email address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                    />

                    {message && (
                        <div className={`border rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
                            {message.text}
                        </div>
                    )}

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Sending link...' : 'Send Magic Link'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <Link href="/recruiter/login" className="text-[#9fc992] hover:text-white text-sm transition-colors">
                        Are you a recruiter? Log in here
                    </Link>
                </div>
            </Card>
        </div>
    );
}
