import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/layout/Header';
import AvatarUpload from '@/app/components/profile/AvatarUpload';

export default async function ProfilePage() {
    const supabase = await createClient();

    // 1. Fetch User Data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Not authenticated</div>;

    const { data: recruiter } = await supabase
        .from('recruiters')
        .select('*, organizations(name)')
        .eq('auth_user_id', user.id)
        .single();

    if (!recruiter) return <div>Recruiter profile not found</div>;

    return (
        <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark">
            <Header title="Your Profile" />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Profile Header Card */}
                    <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-8 border border-border-light dark:border-border-dark shadow-sm flex items-center gap-6">

                        <AvatarUpload
                            uid={user.id}
                            url={recruiter.avatar_url}
                            size={120}
                        />

                        <div>
                            <h1 className="text-2xl font-bold text-foreground-light dark:text-foreground-dark">{recruiter.name || 'Unnamed Recruiter'}</h1>
                            <p className="text-secondary-light dark:text-secondary-dark font-medium">
                                {recruiter.role === 'admin' ? 'Admin' : 'Member'} at {recruiter.organizations?.name || 'Unknown Organization'}
                            </p>
                            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                Active
                            </div>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-border-light dark:border-border-dark">
                            <h2 className="text-lg font-bold text-foreground-light dark:text-foreground-dark">Contact Information</h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-light dark:text-secondary-dark mb-1">Email Address</label>
                                    <p className="text-foreground-light dark:text-foreground-dark font-medium">{recruiter.email}</p>
                                </div>
                                {/* 
                                <div>
                                    <label className="block text-sm font-medium text-secondary-light dark:text-secondary-dark mb-1">Phone Number</label>
                                    <p className="text-foreground-light dark:text-foreground-dark font-medium">+1 (555) 123-4567</p>
                                </div>
                                */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-light dark:text-secondary-dark mb-1">Joined On</label>
                                    <p className="text-foreground-light dark:text-foreground-dark font-medium">
                                        {new Date(recruiter.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                {/* 
                                <div>
                                    <label className="block text-sm font-medium text-secondary-light dark:text-secondary-dark mb-1">Timezone</label>
                                    <p className="text-foreground-light dark:text-foreground-dark font-medium">Pacific Time (PT)</p>
                                </div>
                                */}
                            </div>
                        </div>
                    </div>

                    {/* Account Settings Section */}
                    <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-border-light dark:border-border-dark">
                            <h2 className="text-lg font-bold text-foreground-light dark:text-foreground-dark">Account Settings</h2>
                        </div>
                        <div className="p-8">
                            <p className="text-secondary-light dark:text-secondary-dark text-sm mb-4">
                                Manage your account access and security settings.
                            </p>
                            <button className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-foreground-light dark:text-foreground-dark rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                                Change Password via Email
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
