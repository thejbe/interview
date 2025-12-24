"use client";

// import { useState } from 'react';
// import { Button } from '@/app/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
    const seen = bookings
        .filter(b => (b.status === 'completed' || (b.status === 'confirmed' && new Date(b.slots?.start_time) <= now)))
        .sort((a, b) => new Date(b.slots?.start_time).getTime() - new Date(a.slots?.start_time).getTime());

    const handleWithdraw = async (id: string) => {
        if (!confirm("Are you sure you want to withdraw this candidate?")) return;
        await supabase.from('bookings').update({ status: 'withdrawn' }).eq('id', id);
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
                    <span className="bg-[#2c4823] text-white text-xs px-2 py-0.5 rounded-full ml-auto">{presented.length}</span>
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
                                    <button
                                        onClick={() => handleWithdraw(p.id)}
                                        className="py-1.5 px-2 text-xs text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                        title="Withdraw"
                                    >
                                        <span className="material-symbols-outlined text-sm">block</span>
                                    </button>
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
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 3. Seen Candidates */}
            <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6 flex flex-col">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#9fc992]">history</span>
                    Seen
                    <span className="bg-[#2c4823] text-white text-xs px-2 py-0.5 rounded-full ml-auto">{seen.length}</span>
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {seen.length === 0 ? (
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
                    )}
                </div>
            </div>
        </div>
    );
}
