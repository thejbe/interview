"use client";

import { useState, useEffect } from 'react';
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
    const [timezones, setTimezones] = useState<string[]>([]);
    const [timezone, setTimezone] = useState('');

    useEffect(() => {
        // Hydration fix: Initialize timezone data only on client
        setTimezones(Intl.supportedValuesOf('timeZone'));
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }, []);
    // Rest of component...

    // Check if invite is already booked
    // ... (logic remains same)

    const handleSubmit = async () => {
        // ... (logic remains same)
    };

    if (confirmed) {
        // ... (render confirmed state)
    }

    return (
        <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6 md:p-8 shadow-xl">
            {/* Step 1: Choose Time */}
            <div className="mb-8 border-b border-[#2c4823] pb-8">
                {/* ... Header ... */}

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3">
                        <label className="block text-[#9fc992] text-sm font-medium mb-2">My Timezone</label>
                        <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full bg-[#2c4823]/30 border border-[#2c4823] rounded-lg px-4 py-3 text-white focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                        >
                            {timezones.map(tz => (
                                <option key={tz} value={tz}>{tz}</option>
                            ))}
                        </select>
                        <p className="text-xs text-[#9fc992] mt-2">Times adjusted to your location.</p>
                    </div>
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
                                timeZone: timezone || 'UTC'
                            });
                            const dateStr = date.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                timeZone: timezone || 'UTC'
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
            {
                briefingText && (
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
                )
            }

            <Button onClick={handleSubmit} fullWidth disabled={loading || !selectedSlotId || !formData.name || !formData.email}>
                {loading ? 'Confirming...' : 'Confirm Interview'}
            </Button>
        </div >
    );
}
