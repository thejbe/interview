"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';

interface Slot {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    additional_slot_ids?: string[];
}

interface BookingFormProps {
    slots: Slot[];
    templateId: string;
    briefingText?: string;
    files?: any[];
    existingBooking?: any;
    onlineLink?: string;
}

export function BookingForm({ slots, briefingText, files, existingBooking, onlineLink }: BookingFormProps) {
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: existingBooking?.candidate_name || '',
        email: existingBooking?.candidate_email || '',
        phone: existingBooking?.candidate_phone || ''
    });
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const supabase = createClient();

    // Check if invite is already booked
    if (existingBooking?.status === 'confirmed' && !confirmed) {
        // We could just show the success screen immediately, or a "You are already booked" message.
        // For simplicity, let's treat it as confirmed state but maybe with a different message?
        // Let's rely on setConfirmed(true) in useEffect or just default rendering?
        // But hooks order matters. Let's handle it via conditional rendering or initial state.
        // Actually, let's force confirmed state if already booked.
    }
    // Better to handle "already confirmed" logic:
    // If existingBooking.status === 'confirmed', user sees the success screen.
    // We can initialize 'confirmed' state based on this.
    // BUT we can't do conditional hook calls.
    // Let's modify useState(false) -> useState(existingBooking?.status === 'confirmed');
    // And update the effect.

    const handleSubmit = async () => {
        if (!selectedSlotId || !formData.name || !formData.email) return;
        setLoading(true);

        try {
            const selectedSlot = slots.find(s => s.id === selectedSlotId);
            const additionalIds = selectedSlot?.additional_slot_ids || [];

            let token = existingBooking?.token;

            if (existingBooking) {
                // UPDATE existing invite
                const { error } = await supabase
                    .from('bookings')
                    .update({
                        slot_id: selectedSlotId,
                        candidate_name: formData.name, // Updated name?
                        candidate_email: formData.email, // Updated email?
                        candidate_phone: formData.phone,
                        status: 'confirmed',
                        additional_slot_ids: additionalIds,
                        timezone: timezone
                    })
                    .eq('id', existingBooking.id);

                if (error) throw error;
            } else {
                // INSERT new booking (Public link fallback)
                token = Math.random().toString(36).substring(7);
                const { error } = await supabase.from('bookings').insert({
                    slot_id: selectedSlotId,
                    candidate_name: formData.name,
                    candidate_email: formData.email,
                    candidate_phone: formData.phone,
                    token: token,
                    status: 'confirmed',
                    additional_slot_ids: additionalIds,
                    timezone: timezone
                });
                if (error) throw error;
            }

            // 2. Update slot statuses (Primary + Additional)
            const allSlotIds = [selectedSlotId, ...additionalIds];
            await supabase.from('slots').update({ status: 'booked' }).in('id', allSlotIds);

            setConfirmed(true);
        } catch (err: any) {
            alert('Error booking slot: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (confirmed) {
        const finalLink = existingBooking?.meeting_link || onlineLink; // Prefer specific booking link
        const platform = existingBooking?.meeting_platform || 'Online Meeting';

        return (
            <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-8 text-center shadow-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2c4823] mb-4">
                    <span className="material-symbols-outlined text-primary text-3xl">check</span>
                </div>
                <h2 className="text-white text-2xl font-bold mb-2">Interview Confirmed!</h2>
                <p className="text-[#9fc992] mb-6">You will receive a calendar invitation shortly.</p>

                {finalLink && (
                    <div className="bg-[#2c4823]/30 border border-[#2c4823] rounded-xl p-4 max-w-md mx-auto">
                        <h3 className="text-white font-bold mb-2 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-primary">video_camera_front</span>
                            Join {platform}
                        </h3>
                        <a
                            href={finalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                        >
                            {finalLink}
                        </a>
                        <div className="mt-2 text-xs text-gray-400">
                            Please save this link for your interview.
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6 md:p-8 shadow-xl">
            {/* Step 1: Choose Time */}
            <div className="mb-8 border-b border-[#2c4823] pb-8">
                <h2 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-[#142210] text-sm font-bold">1</span>
                    Choose a time
                </h2>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3">
                        <label className="block text-[#9fc992] text-sm font-medium mb-2">My Timezone</label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full bg-[#2c4823]/30 border border-[#2c4823] rounded-lg px-4 py-3 text-white focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                        >
                            {Intl.supportedValuesOf('timeZone').map(tz => (
                                <option key={tz} value={tz}>{tz}</option>
                            ))}
                        </select>
                        <p className="text-xs text-[#9fc992] mt-2">Times adjusted to your location.</p>
                    </div>

                    <div className="flex-1">
                        <label className="block text-[#9fc992] text-sm font-medium mb-2">Available Slots</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {slots.length === 0 && <p className="text-gray-500 text-sm">No slots available.</p>}
                            {slots.map(slot => {
                                const date = new Date(slot.start_time);
                                // Convert to selected timezone
                                const timeStr = date.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: timezone
                                });
                                const dateStr = date.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    timeZone: timezone
                                });
                                const isSelected = selectedSlotId === slot.id;

                                return (
                                    <button
                                        key={slot.id}
                                        onClick={() => setSelectedSlotId(slot.id)}
                                        className={`px-4 py-3 rounded-lg border transition-all text-center relative ${isSelected ? 'border-2 border-primary bg-primary/10 text-white' : 'border-[#2c4823] bg-[#2c4823]/30 text-white hover:border-primary hover:bg-primary/10'}`}
                                    >
                                        {isSelected && (
                                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[#142210] text-xs font-bold">check</span>
                                            </span>
                                        )}
                                        <span className="block font-bold">{timeStr}</span>
                                        <span className="text-xs text-[#9fc992]">{dateStr}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 2: Details */}
            <div className="mb-8 border-b border-[#2c4823] pb-8">
                <h2 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-[#142210] text-sm font-bold">2</span>
                    Your details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Jane Doe" />
                    <Input label="Email Address" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="jane@example.com" />
                    <div className="md:col-span-2">
                        <Input label="Phone Number (Optional)" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                    </div>
                </div>
            </div>

            {/* Briefing */}
            {briefingText && (
                <div className="mb-8">
                    <div className="bg-[#2c4823]/20 border border-[#2c4823] rounded-xl p-4">
                        <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">info</span>
                            Interview Briefing
                        </h3>
                        <p className="text-gray-300 text-sm mb-3">
                            {briefingText}
                        </p>
                        {files && files.length > 0 && (
                            <div className="flex flex-col gap-2">
                                {files.map((file, idx) => (
                                    <a key={idx} href={file.file_url} target="_blank" className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline">
                                        <span className="material-symbols-outlined text-lg">attach_file</span>
                                        {file.file_name || 'Attachment'}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Button onClick={handleSubmit} fullWidth disabled={loading || !selectedSlotId || !formData.name || !formData.email}>
                {loading ? 'Confirming...' : 'Confirm Interview'}
            </Button>
        </div>
    );
}
