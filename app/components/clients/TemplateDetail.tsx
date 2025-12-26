"use client";

import { useState } from 'react';
// import { Button } from '@/app/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { createCandidateInvite } from '@/app/recruiter/actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TemplateDetailProps {
    templateId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bookings: any[];
}

export function TemplateDetail({ templateId, bookings }: TemplateDetailProps) {
    const router = useRouter();
    const supabase = createClient();
    const now = new Date();

    // Filter Lists
    const presented = bookings.filter(b => b.status === 'pending' || (b.status === 'open' && b.invite_token)); // 'pending' usually means invited
    // Sort upcoming by date ascending (closest first)
    const upcoming = bookings
        .filter(b => b.status === 'confirmed' && new Date(b.slots?.start_time) > now)
        .sort((a, b) => new Date(a.slots?.start_time).getTime() - new Date(b.slots?.start_time).getTime());

    // Sort seen by date descending (most recent first)
    // Sort seen by date descending (most recent first)
    const seen = bookings
        .filter(b => (b.status === 'completed' || (b.status === 'confirmed' && new Date(b.slots?.start_time) <= now)))
        .sort((a, b) => new Date(b.slots?.start_time).getTime() - new Date(a.slots?.start_time).getTime());

    const withdrawn = bookings
        .filter(b => b.status === 'withdrawn')
        .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()); // Recent last? Or recent first? Let's do recent first.
    // Actually typical sort is recent first
    // .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    const [activeTab, setActiveTab] = useState<'seen' | 'withdrawn'>('seen');



    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        name: '',
        email: '',
    });

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        try {
            await createCandidateInvite(
                templateId,
                inviteForm.name,
                inviteForm.email,
            );
            toast.success('Candidate invited successfully');
            setShowInviteModal(false);
            setInviteForm({ name: '', email: '' });
            router.refresh();
        } catch (error: any) {
            toast.error('Failed to invite candidate: ' + error.message);
        } finally {
            setIsInviting(false);
        }
    };

    const [confirmingWithdrawId, setConfirmingWithdrawId] = useState<string | null>(null);

    const handleWithdraw = async (id: string) => {
        const { error } = await supabase.from('bookings').update({ status: 'withdrawn' }).eq('id', id);

        if (error) {
            toast.error('Failed to withdraw: ' + error.message);
            setConfirmingWithdrawId(null);
            return;
        }

        toast.success('Candidate withdrawn.');
        setConfirmingWithdrawId(null);
        router.refresh();
    };

    const handleCopyLink = (token: string) => {
        const link = `${window.location.origin}/booking/${token}`;
        navigator.clipboard.writeText(link);
        toast.success("Invite link copied to clipboard!");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* 1. Candidates Presented */}
            <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6 flex flex-col">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#9fc992]">perm_contact_calendar</span>
                    Presented
                    <span className="bg-[#2c4823] text-white text-xs px-2 py-0.5 rounded-full ml-2">{presented.length}</span>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="ml-auto w-6 h-6 flex items-center justify-center bg-[#9fc992] hover:bg-[#8eb882] text-[#152211] rounded-full transition-colors"
                        title="Add Candidate"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {presented.length === 0 ? (
                        <p className="text-center text-[#9fc992] text-sm py-8">No active candidates.</p>
                    ) : (
                        presented.map(p => (
                            <div key={p.id} className="bg-[#2c4823]/10 border border-[#2c4823]/30 rounded-lg p-3 group hover:bg-[#2c4823]/20 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-white font-bold text-sm">{p.candidate_name}</p>
                                        <p className="text-[#9fc992] text-xs">{p.candidate_email}</p>
                                    </div>
                                    <div className="text-[10px] bg-yellow-900/30 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-900/50">Invited</div>
                                </div>
                                <div className="text-xs text-white/40 mb-3" suppressHydrationWarning>
                                    Invited {format(new Date(p.created_at), 'dd MMM yyyy')}
                                </div>
                                <div className="flex gap-2">
                                    {p.invite_token && (
                                        <button
                                            onClick={() => handleCopyLink(p.invite_token)}
                                            className="flex-1 py-1.5 text-xs bg-[#2c4823] hover:bg-[#2c4823]/80 text-white rounded transition-colors"
                                        >
                                            Copy Link
                                        </button>
                                    )}
                                    {confirmingWithdrawId === p.id ? (
                                        <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                            <button
                                                onClick={() => handleWithdraw(p.id)}
                                                className="py-1 px-2 text-[10px] bg-red-500 hover:bg-red-600 text-white rounded font-bold transition-colors"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setConfirmingWithdrawId(null)}
                                                className="py-1 px-1 text-white/40 hover:text-white transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmingWithdrawId(p.id)}
                                            className="py-1.5 px-2 text-xs text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                            title="Withdraw"
                                        >
                                            <span className="material-symbols-outlined text-sm">block</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 2. Upcoming Interviews */}
            <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6 flex flex-col">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">calendar_clock</span>
                    Upcoming
                    <span className="bg-[#2c4823] text-white text-xs px-2 py-0.5 rounded-full ml-auto">{upcoming.length}</span>
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {upcoming.length === 0 ? (
                        <p className="text-center text-[#9fc992] text-sm py-8">No upcoming interviews.</p>
                    ) : (
                        upcoming.map(u => {
                            const date = new Date(u.slots?.start_time);
                            return (
                                <div key={u.id} className="bg-[#2c4823]/10 border border-[#2c4823]/30 rounded-lg p-3 border-l-4 border-l-primary">
                                    <div className="flex items-start justify-between mb-2">
                                        <div suppressHydrationWarning>
                                            <p className="text-white font-bold text-sm block mb-1">
                                                {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </p>
                                            <p className="text-primary text-xs font-bold bg-primary/10 px-1.5 py-0.5 rounded inline-block">
                                                {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mb-2">
                                        <p className="text-white text-sm font-medium">{u.candidate_name}</p>
                                        <p className="text-[#9fc992] text-xs">w/ {u.slots?.hiring_managers?.name || 'Round Robin'}</p>
                                    </div>

                                    <div className="flex justify-end pt-2 border-t border-[#2c4823]/30">
                                        {confirmingWithdrawId === u.id ? (
                                            <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                                <button
                                                    onClick={() => handleWithdraw(u.id)}
                                                    className="py-1 px-2 text-[10px] bg-red-500 hover:bg-red-600 text-white rounded font-bold transition-colors"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => setConfirmingWithdrawId(null)}
                                                    className="py-1 px-1 text-white/40 hover:text-white transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmingWithdrawId(u.id)}
                                                className="py-1 px-2 text-xs text-red-400 hover:bg-red-900/20 rounded transition-colors flex items-center gap-1"
                                                title="Withdraw"
                                            >
                                                <span className="material-symbols-outlined text-sm">block</span>
                                                <span>Withdraw</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 3. History (Seen & Withdrawn) */}
            <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex bg-[#2c4823]/50 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('seen')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'seen' ? 'bg-[#9fc992] text-[#152211] shadow-sm' : 'text-white/60 hover:text-white'}`}
                        >
                            Seen ({seen.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('withdrawn')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${activeTab === 'withdrawn' ? 'bg-[#9fc992] text-[#152211] shadow-sm' : 'text-white/60 hover:text-white'}`}
                        >
                            Withdrawn ({withdrawn.length})
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {activeTab === 'seen' ? (
                        seen.length === 0 ? (
                            <p className="text-center text-[#9fc992] text-sm py-8">No past interviews.</p>
                        ) : (
                            seen.map(s => {
                                const date = new Date(s.slots?.start_time);
                                return (
                                    <div key={s.id} className="bg-[#2c4823]/10 border border-[#2c4823]/30 rounded-lg p-3 group">
                                        <div className="flex justify-between mb-1">
                                            <p className="text-white font-bold text-sm">{s.candidate_name}</p>
                                            <span className="text-[10px] text-[#9fc992]" suppressHydrationWarning>{date.toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-white/60 mb-3">{s.candidate_email}</p>
                                        <button
                                            onClick={() => { toast.info('Rebook flow to be implemented (reuse BookingModal)'); }}
                                            className="w-full py-1.5 text-xs border border-[#2c4823] hover:bg-[#2c4823] text-[#9fc992] hover:text-white rounded transition-colors"
                                        >
                                            Rebook
                                        </button>
                                    </div>
                                );
                            })
                        )
                    ) : (
                        withdrawn.length === 0 ? (
                            <p className="text-center text-[#9fc992] text-sm py-8">No withdrawn candidates.</p>
                        ) : (
                            withdrawn.map(w => (
                                <div key={w.id} className="bg-red-900/10 border border-red-900/30 rounded-lg p-3 opacity-75 hover:opacity-100 transition-opacity">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-white font-bold text-sm line-through decoration-white/30">{w.candidate_name}</p>
                                        <span className="text-[10px] bg-red-900/30 text-red-400 px-1.5 py-0.5 rounded border border-red-900/50">Withdrawn</span>
                                    </div>
                                    <p className="text-xs text-white/50">{w.candidate_email}</p>
                                    <div className="mt-2 text-[10px] text-white/30">
                                        {w.updated_at ? `Withdrawn ${format(new Date(w.updated_at), 'dd MMM')}` : 'Withdrawn'}
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a2c15] border border-[#2c4823] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Invite Candidate</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleInviteSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#9fc992] uppercase tracking-wider mb-2">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={inviteForm.name}
                                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                                    className="w-full bg-[#0a1108] border border-[#2c4823] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="e.g. Jane Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#9fc992] uppercase tracking-wider mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    className="w-full bg-[#0a1108] border border-[#2c4823] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="jane@example.com"
                                />
                            </div>



                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isInviting}
                                    className="bg-primary hover:bg-primary/90 text-[#142210] px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isInviting ? 'Sending Invite...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}
