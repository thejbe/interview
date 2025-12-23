"use client";

import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface BookingEntryFormProps {
    templates: any[]; // Interview templates
}

export function BookingEntryForm({ templates }: BookingEntryFormProps) {
    // Phase 1: Select Template
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    // Phase 2: Select Action
    const [actionType, setActionType] = useState<'manual' | 'share' | null>(null);
    // Phase 3: Details
    const [candidateName, setCandidateName] = useState('');
    const [candidateEmail, setCandidateEmail] = useState('');
    const [selectedSlotId, setSelectedSlotId] = useState<string>('');
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);

    // Outcome
    const [inviteLink, setInviteLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    // Fetch slots when template + manual action selected
    const handleTemplateSelect = async (templateId: string) => {
        setSelectedTemplateId(templateId);
        setAvailableSlots([]);
        setSelectedSlotId('');

        if (actionType === 'manual') {
            await fetchSlots(templateId);
        }
    };

    const handleActionSelect = async (type: 'manual' | 'share') => {
        setActionType(type);
        if (type === 'manual' && selectedTemplateId) {
            await fetchSlots(selectedTemplateId);
        }
    };

    const fetchSlots = async (templateId: string) => {
        const { data } = await supabase
            .from('slots')
            .select(`
                *,
                hiring_managers (name)
            `)
            .eq('template_id', templateId)
            .eq('status', 'open')
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true });

        if (data) {
            setAvailableSlots(data);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (actionType === 'manual') {
                if (!selectedSlotId) throw new Error("Please select a time slot.");

                // Create confirmed booking
                const token = crypto.randomUUID();
                const { error } = await supabase.from('bookings').insert({
                    template_id: selectedTemplateId,
                    slot_id: selectedSlotId,
                    candidate_name: candidateName,
                    candidate_email: candidateEmail,
                    status: 'confirmed',
                    token: token
                });

                if (error) throw error;

                // Update slot status
                await supabase.from('slots').update({ status: 'booked' }).eq('id', selectedSlotId);

                alert('Interview booked successfully!');
                router.push('/recruiter/bookings');
                router.refresh();

            } else {
                // Share Invite
                const token = crypto.randomUUID();
                const { error } = await supabase.from('bookings').insert({
                    template_id: selectedTemplateId,
                    candidate_name: candidateName,
                    candidate_email: candidateEmail,
                    status: 'pending',
                    token: token,
                    invite_token: token // Use same token for simplicity or generate separate
                });

                if (error) throw error;

                // Generate Link
                const link = `${window.location.origin}/booking/${token}`;
                setInviteLink(link);
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-[#152211] border border-[#2c4823] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Create New Booking</h2>

            {/* Step 1: Template */}
            <div className="mb-6">
                <label className="block text-[#9fc992] text-sm font-medium mb-2">Select Template</label>
                <select
                    className="w-full bg-[#152211] border border-[#2c4823] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-3"
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                >
                    <option value="">-- Choose a Role --</option>
                    {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.companies?.name})</option>
                    ))}
                </select>
            </div>

            {/* Step 2: Action Type */}
            {selectedTemplateId && !inviteLink && (
                <div className="mb-8 grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => handleActionSelect('manual')}
                        className={`p-4 rounded-xl border text-left transition-all ${actionType === 'manual'
                                ? 'border-primary bg-primary/10'
                                : 'border-[#2c4823] hover:border-primary/50'
                            }`}
                    >
                        <span className="material-symbols-outlined text-primary mb-2 text-2xl">event_available</span>
                        <h3 className="text-white font-bold">Manual Booking</h3>
                        <p className="text-xs text-[#9fc992] mt-1">Book a specific time slot for the candidate now.</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleActionSelect('share')}
                        className={`p-4 rounded-xl border text-left transition-all ${actionType === 'share'
                                ? 'border-primary bg-primary/10'
                                : 'border-[#2c4823] hover:border-primary/50'
                            }`}
                    >
                        <span className="material-symbols-outlined text-primary mb-2 text-2xl">share</span>
                        <h3 className="text-white font-bold">Share Availability</h3>
                        <p className="text-xs text-[#9fc992] mt-1">Send a link for the candidate to pick their own time.</p>
                    </button>
                </div>
            )}

            {/* Step 3: Form */}
            {selectedTemplateId && actionType && !inviteLink && (
                <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[#9fc992] text-sm font-medium mb-2">Candidate Name</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-[#2c4823]/30 border border-[#2c4823] rounded-lg px-4 py-3 text-white focus:ring-primary focus:border-primary"
                                value={candidateName}
                                onChange={e => setCandidateName(e.target.value)}
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-[#9fc992] text-sm font-medium mb-2">Candidate Email</label>
                            <input
                                required
                                type="email"
                                className="w-full bg-[#2c4823]/30 border border-[#2c4823] rounded-lg px-4 py-3 text-white focus:ring-primary focus:border-primary"
                                value={candidateEmail}
                                onChange={e => setCandidateEmail(e.target.value)}
                                placeholder="jane@example.com"
                            />
                        </div>
                    </div>

                    {/* Manual: Slot Selection */}
                    {actionType === 'manual' && (
                        <div>
                            <label className="block text-[#9fc992] text-sm font-medium mb-2">Select Time Slot</label>
                            {availableSlots.length === 0 ? (
                                <p className="text-sm text-yellow-500">No open slots available for this template.</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                    {availableSlots.map(slot => {
                                        const date = new Date(slot.start_time);
                                        return (
                                            <div
                                                key={slot.id}
                                                onClick={() => setSelectedSlotId(slot.id)}
                                                className={`p-3 rounded-lg border cursor-pointer text-sm ${selectedSlotId === slot.id
                                                        ? 'border-primary bg-primary/20 text-white chat-bubble'
                                                        : 'border-[#2c4823] bg-[#2c4823]/30 text-gray-300 hover:bg-[#2c4823]/50'
                                                    }`}
                                            >
                                                <div className="font-bold">
                                                    {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </div>
                                                <div>
                                                    {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                                </div>
                                                <div className="text-xs text-[#9fc992] mt-1 truncate">
                                                    w/ {slot.hiring_managers?.name}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <Button type="submit" disabled={isSubmitting || (actionType === 'manual' && !selectedSlotId)} className="w-full">
                        {isSubmitting ? 'Processing...' : (actionType === 'manual' ? 'Confirm Booking' : 'Generate Invite Link')}
                    </Button>
                </form>
            )}

            {/* Success State: Invite Link */}
            {inviteLink && (
                <div className="animate-fade-in bg-primary/10 border border-primary rounded-xl p-6 text-center">
                    <span className="material-symbols-outlined text-primary text-4xl mb-2">check_circle</span>
                    <h3 className="text-white text-lg font-bold mb-2">Invite Link Generated!</h3>
                    <p className="text-[#9fc992] mb-4">Share this link with {candidateName} to let them book their interview.</p>

                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            value={inviteLink}
                            className="flex-1 bg-black/20 border border-primary/30 rounded px-3 py-2 text-sm text-white"
                        />
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                navigator.clipboard.writeText(inviteLink);
                                alert('Copied!');
                            }}
                        >
                            Copy
                        </Button>
                    </div>

                    <div className="mt-6">
                        <Button variant="ghost" onClick={() => {
                            setInviteLink('');
                            setCandidateName('');
                            setCandidateEmail('');
                            setActionType(null);
                        }}>
                            Create Another Booking
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
