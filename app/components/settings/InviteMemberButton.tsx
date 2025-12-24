"use client";

import React, { useState } from 'react';
import { Modal } from '@/app/components/ui/Modal';
import { inviteUser } from '@/app/recruiter/actions';

export function InviteMemberButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'admin' | 'member'>('member');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        // Split emails by comma, trim whitespace, remove empty
        const emails = email.split(',').map(e => e.trim()).filter(e => e.length > 0);

        if (emails.length === 0) {
            setStatus('error');
            setErrorMessage('Please enter at least one email address');
            return;
        }

        let sentCount = 0;
        let errors: string[] = [];

        for (const singleEmail of emails) {
            const result = await inviteUser(singleEmail, role);
            if (result.success) {
                sentCount++;
            } else {
                errors.push(`${singleEmail}: ${result.message}`);
            }
        }

        if (sentCount > 0 && errors.length === 0) {
            setStatus('success');
            setTimeout(() => {
                setIsOpen(false);
                setStatus('idle');
                setEmail('');
            }, 1000);
        } else if (sentCount > 0 && errors.length > 0) {
            setStatus('error'); // Show mixed state if needed, or success with warnings? 
            // For now, if ANY failed, show error, but acknowledge successes?
            setErrorMessage(`Sent ${sentCount} invites. Failed: ${errors.join(', ')}`);
        } else {
            setStatus('error');
            setErrorMessage(errors.join(', ') || 'Failed to send invitations');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-[#142210] rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-sm"
            >
                <span className="material-symbols-outlined">add</span>
                Invite Member
            </button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Invite Team Member"
            >
                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in">
                        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-3xl">check</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Invitation(s) Sent!</h3>
                        <p className="text-gray-400">Emails have been sent to your team members.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="invite-emails" className="block text-sm font-medium text-gray-300 mb-2">Email Addresses (comma separated)</label>
                            <input
                                id="invite-emails"
                                type="text"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg bg-black/20 border border-white/10 text-white placeholder:text-white/30 focus:ring-primary focus:border-primary transition-all"
                                placeholder="colleague@example.com, another@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('member')}
                                    className={`p-4 rounded-xl border text-left transition-all ${role === 'member' ? 'bg-primary/10 border-primary' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}
                                >
                                    <div className={`font-bold mb-1 ${role === 'member' ? 'text-primary' : 'text-white'}`}>Member</div>
                                    <div className="text-xs text-gray-400">Can manage clients and bookings within the organization.</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('admin')}
                                    className={`p-4 rounded-xl border text-left transition-all ${role === 'admin' ? 'bg-primary/10 border-primary' : 'bg-black/20 border-white/10 hover:bg-white/5'}`}
                                >
                                    <div className={`font-bold mb-1 ${role === 'admin' ? 'text-primary' : 'text-white'}`}>Admin</div>
                                    <div className="text-xs text-gray-400">Full access to settings, team management, and billing.</div>
                                </button>
                            </div>
                        </div>

                        {status === 'error' && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                {errorMessage}
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="mr-3 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-[#142210] rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status === 'loading' && <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>}
                                Send Invite
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
}
