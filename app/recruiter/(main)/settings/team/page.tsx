import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/layout/Header';
import { InviteMemberButton } from '@/app/components/settings/InviteMemberButton';

export default async function TeamSettingsPage() {
    const supabase = await createClient();

    // 1. Get Current User & Organization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Not authenticated</div>;

    const { data: recruiter } = await supabase
        .from('recruiters')
        .select('organization_id')
        .eq('auth_user_id', user.id)
        .single();

    if (!recruiter?.organization_id) return <div>No organization found</div>;

    // 2. Fetch Team Members
    const { data: members } = await supabase
        .from('recruiters')
        .select('*')
        .eq('organization_id', recruiter.organization_id)
        .order('created_at');

    // 3. Fetch Pending Invitations
    const { data: invitations } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', recruiter.organization_id)
        .eq('status', 'pending')
        .order('created_at');


    return (
        <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark">
            <Header
                title="Team Management"
                actions={<InviteMemberButton />}
            />

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Team Members */}
                    <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-border-light dark:border-border-dark overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-white/5">
                            <h2 className="font-bold text-foreground-light dark:text-foreground-dark">Team Members</h2>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                            {members?.map((member) => (
                                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt={member.name || ''} className="size-full rounded-full object-cover" />
                                            ) : (
                                                (member.name?.[0] || member.email?.[0] || '?').toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground-light dark:text-foreground-dark">{member.name || 'Unnamed'}</p>
                                            <p className="text-sm text-secondary-light dark:text-secondary-dark">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-400'}`}>
                                            {member.role || 'member'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Invitations */}
                    {invitations && invitations.length > 0 && (
                        <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-border-light dark:border-border-dark overflow-hidden opacity-80">
                            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-white/5">
                                <h2 className="font-bold text-foreground-light dark:text-foreground-dark">Pending Invitations</h2>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {invitations.map((inv) => (
                                    <div key={inv.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
                                                <span className="material-symbols-outlined text-lg">mail</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground-light dark:text-foreground-dark">{inv.email}</p>
                                                <p className="text-sm text-secondary-light dark:text-secondary-dark">Invited as {inv.role}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-orange-500 font-medium bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">Pending</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
