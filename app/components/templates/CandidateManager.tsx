'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { createCandidateInvite } from '@/app/recruiter/actions';
import { ManualBookingModal } from './ManualBookingModal';

interface Booking {
    id: string;
    candidate_name: string;
    candidate_email: string;
    status: string;
    token: string;
    slot_id?: string | null;
}

interface CandidateManagerProps {
    templateId: string;
    candidates: Booking[];
    managers: any[];
    durationPromise: Promise<number> | number; // Handle both for now or just number
}

export function CandidateManager({ templateId, candidates, managers, durationPromise }: CandidateManagerProps) {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [manualBookingId, setManualBookingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [meetingPlatform, setMeetingPlatform] = useState('');
    const [loading, setLoading] = useState(false);

    // Safety check for duration if it comes as promise (server component passing prop)
    // Actually in client component we expect value. Let's assume number.
    const duration = typeof durationPromise === 'number' ? durationPromise : 60;

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createCandidateInvite(templateId, name, email, meetingLink, meetingPlatform);
            setShowInviteModal(false);
            setName('');
            setEmail('');
            setMeetingLink('');
            setMeetingPlatform('');
        } catch (error) {
            console.error('Failed to invite:', error);
            alert('Failed to send invite');
        } finally {
            setLoading(false);
        }
    };

    const copyLink = (token: string) => {
        const link = `${window.location.origin}/booking/${token}`;
        navigator.clipboard.writeText(link);
        alert('Booking link copied to clipboard!');
    };

    return (
        <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">Candidates</h2>
                    <p className="text-[#9fc992]">Manage requests and track bookings.</p>
                </div>
                <Button onClick={() => setShowInviteModal(true)} type="button">
                    <span className="material-symbols-outlined mr-2">person_add</span>
                    Add Candidate
                </Button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {candidates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-[#2c4823]/10 rounded-xl border border-[#2c4823] border-dashed">
                        No candidates invited yet.
                    </div>
                ) : (
                    candidates.map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-4 bg-[#2c4823]/20 border border-[#2c4823] rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${c.status === 'confirmed' ? 'bg-green-600' : 'bg-gray-600'}`}>
                                    {c.candidate_name[0]}
                                </div>
                                <div>
                                    <div className="text-white font-bold">{c.candidate_name}</div>
                                    <div className="text-sm text-gray-400">{c.candidate_email}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {c.status !== 'confirmed' && (
                                    <button
                                        onClick={() => setManualBookingId(c.id)}
                                        className="text-xs text-primary hover:underline font-bold"
                                    >
                                        Manual Book
                                    </button>
                                )}
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${c.status === 'confirmed' ? 'bg-green-900/50 text-green-400 border border-green-800' : 'bg-yellow-900/50 text-yellow-400 border border-yellow-800'}`}>
                                    {c.status === 'confirmed' ? 'Booked' : 'Pending'}
                                </span>
                                <button
                                    onClick={() => copyLink(c.token)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                    title="Copy Booking Link"
                                >
                                    <span className="material-symbols-outlined">link</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {manualBookingId && (
                <ManualBookingModal
                    bookingId={manualBookingId}
                    templateId={templateId}
                    managers={managers}
                    duration={duration}
                    onClose={() => setManualBookingId(null)}
                />
            )}

            {/* Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a2c15] border border-[#2c4823] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Invite Candidate</h3>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#9fc992] uppercase tracking-wider mb-2">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#0a1108] border border-[#2c4823] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="e.g. Jane Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#9fc992] uppercase tracking-wider mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#0a1108] border border-[#2c4823] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="jane@example.com"
                                />
                            </div>

                            <div className="border-t border-[#2c4823] my-4 pt-4">
                                <h4 className="text-sm font-bold text-white mb-2">Meeting Details (Optional)</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-[#9fc992] uppercase tracking-wider mb-2">Meeting Link</label>
                                        <input
                                            type="url"
                                            value={meetingLink}
                                            onChange={(e) => setMeetingLink(e.target.value)}
                                            className="w-full bg-[#0a1108] border border-[#2c4823] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                            placeholder="https://zoom.us/j/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#9fc992] uppercase tracking-wider mb-2">Platform</label>
                                        <input
                                            type="text"
                                            list="platforms"
                                            value={meetingPlatform}
                                            onChange={(e) => setMeetingPlatform(e.target.value)}
                                            className="w-full bg-[#0a1108] border border-[#2c4823] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                            placeholder="e.g. Zoom"
                                        />
                                        <datalist id="platforms">
                                            <option value="Zoom" />
                                            <option value="Google Meet" />
                                            <option value="Microsoft Teams" />
                                        </datalist>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowInviteModal(false)}
                                    className="!text-gray-400 hover:!text-white"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Invite'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
