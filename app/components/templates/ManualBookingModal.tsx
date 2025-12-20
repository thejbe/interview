'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { createManualBooking } from '@/app/recruiter/actions';

interface ManualBookingModalProps {
    bookingId: string;
    templateId: string;
    managers: any[]; // List of available managers
    duration: number; // minutes
    onClose: () => void;
}

export function ManualBookingModal({ bookingId, templateId, managers, duration, onClose }: ManualBookingModalProps) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
    const [meetingLink, setMeetingLink] = useState('');
    const [meetingPlatform, setMeetingPlatform] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createManualBooking(
                bookingId,
                templateId,
                date,
                time,
                duration,
                selectedManagers,
                meetingLink,
                meetingPlatform
            );
            onClose();
            alert('Candidate manually booked!');
        } catch (error) {
            console.error('Failed to book:', error);
            alert('Failed to override booking');
        } finally {
            setLoading(false);
        }
    };

    const toggleManager = (id: string) => {
        if (selectedManagers.includes(id)) {
            setSelectedManagers(selectedManagers.filter(m => m !== id));
        } else {
            setSelectedManagers([...selectedManagers, id]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a2c15] border border-[#2c4823] rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Manual Override Booking</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 mb-6 flex gap-3 items-start">
                    <span className="material-symbols-outlined text-yellow-500 shrink-0">warning</span>
                    <p className="text-xs text-yellow-200">
                        This will force-book the candidate and create new slots for the selected managers, ignoring their current availability.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#9fc992] uppercase tracking-wider mb-2">Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-[#0a1108] border border-[#2c4823] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#9fc992] uppercase tracking-wider mb-2">Time (UTC/Local)</label>
                            <input
                                type="time"
                                required
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full bg-[#0a1108] border border-[#2c4823] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#9fc992] uppercase tracking-wider mb-2">Select Interviewers</label>
                        <div className="max-h-40 overflow-y-auto space-y-2 border border-[#2c4823] rounded-xl p-2 bg-[#0a1108]">
                            {managers.map(m => (
                                <div
                                    key={m.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedManagers.includes(m.id) ? 'bg-primary/20 border border-primary' : 'hover:bg-white/5 border border-transparent'}`}
                                    onClick={() => toggleManager(m.id)}
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedManagers.includes(m.id) ? 'border-primary bg-primary' : 'border-gray-500'}`}>
                                        {selectedManagers.includes(m.id) && <span className="material-symbols-outlined text-black text-[10px] font-bold">check</span>}
                                    </div>
                                    <span className="text-white text-sm font-medium">{m.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-[#2c4823] pt-4">
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
                                    list="platforms-manual"
                                    value={meetingPlatform}
                                    onChange={(e) => setMeetingPlatform(e.target.value)}
                                    className="w-full bg-[#0a1108] border border-[#2c4823] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    placeholder="e.g. Zoom"
                                />
                                <datalist id="platforms-manual">
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
                            onClick={onClose}
                            className="!text-gray-400 hover:!text-white"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || selectedManagers.length === 0}>
                            {loading ? 'Booking...' : 'Confirm Booking'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
