'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function OnboardingPage() {
    const [companyName, setCompanyName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Create Company
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .insert({ name: companyName })
                .select()
                .single();

            if (companyError) throw companyError;

            // 2. Create Recruiter profile linked to this company
            const { error: recruiterError } = await supabase
                .from('recruiters')
                .insert({
                    auth_user_id: user.id,
                    company_id: company.id,
                    name: user.email?.split('@')[0] || 'Admin', // Default name
                    email: user.email,
                });

            if (recruiterError) throw recruiterError;

            toast.success('Workspace created successfully!');
            router.push('/recruiter/dashboard');
        } catch (error: any) {
            console.error('Onboarding error:', error);
            toast.error(error.message || 'Failed to create workspace');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Create your workspace
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Get started by creating a company workspace for your team.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                                Company Name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="companyName"
                                    name="companyName"
                                    type="text"
                                    required
                                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Acme Corp"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {isLoading ? 'Creating...' : 'Create Workspace'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
