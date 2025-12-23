"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import {
    startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
    format, addMonths, subMonths, isSameMonth, isSameDay, parseISO
} from 'date-fns';

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

export function BookingForm({ slots, templateId, briefingText, files, existingBooking, onlineLink }: BookingFormProps) {
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

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        // Hydration fix: Initialize timezone data only on client
        setTimezones(Intl.supportedValuesOf('timeZone'));
        const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(localTz);
    }, []);

    // Group slots by Date string (YYYY-MM-DD) in the selected timezone
    const slotsByDate = useMemo(() => {
        const groups: Record<string, Slot[]> = {};
        if (!timezone) return groups;

        slots.forEach(slot => {
            const date = new Date(slot.start_time);
            // Get YYYY-MM-DD in the selected timezone
            // en-CA is YYYY-MM-DD
            try {
                const dateKey = date.toLocaleDateString('en-CA', { timeZone: timezone });
                if (!groups[dateKey]) groups[dateKey] = [];
                groups[dateKey].push(slot);
            } catch (e) {
                // Fallback for invalid timezones in older browsers (shouldn't happen with Intl list)
            }
        });
        return groups;
    }, [slots, timezone]);

    // Auto-select first available date
    useEffect(() => {
        const dates = Object.keys(slotsByDate).sort();
        if (dates.length > 0 && !selectedDate) {
            const firstDateStr = dates[0];
            // Parse YYYY-MM-DD
            // We need to be careful about timezones here. 
            // If we parse ISO '2025-01-01', it will be local midnight.
            // This matches the calendar day generation usually.
            const [y, m, d] = firstDateStr.split('-').map(Number);
            const dateObj = new Date(y, m - 1, d);
            setSelectedDate(dateObj);
            // Also jump calendar to that month if it's far away?
            setCurrentMonth(dateObj);
        }
    }, [slotsByDate, selectedDate]);

    // Calendar Grid Gen
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    const handlePreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setSelectedSlotId(null); // Reset slot selection when changing date
    };

    // Derived slots for selected date
    const currentSlots = useMemo(() => {
        if (!selectedDate || !timezone) return [];
        const dateKey = format(selectedDate, 'yyyy-MM-dd');
        return slotsByDate[dateKey] || [];
    }, [selectedDate, slotsByDate, timezone]);

    const handleSubmit = async () => {
        if (!selectedSlotId) return;
        setLoading(true);
        const supabase = createClient();

        // Check if slot still open
        const { data: slotCheck } = await supabase.from('slots').select('status').eq('id', selectedSlotId).single();
        if (!slotCheck || slotCheck.status !== 'open') {
            alert('This slot is no longer available. Please choose another.');
            setLoading(false);
            return;
        }

        // Create booking
        let inviteToken = crypto.randomUUID();

        const { error: bookingError } = await supabase.from('bookings').insert({
            slot_id: selectedSlotId,
            candidate_name: formData.name,
            candidate_email: formData.email,
            candidate_phone: formData.phone,
            status: 'confirmed',
            token: inviteToken,
            template_id: templateId,
            additional_slot_ids: slots.find(s => s.id === selectedSlotId)?.additional_slot_ids || []
        });

        if (bookingError) {
            console.error(bookingError);
            alert('Error creating booking: ' + bookingError.message);
            setLoading(false);
            return;
        }

        // Update slot status
        const slot = slots.find(s => s.id === selectedSlotId);
        const allSlotIds = [slot?.id, ...(slot?.additional_slot_ids || [])].filter(Boolean);

        const { error: slotError } = await supabase
            .from('slots')
            .update({ status: 'booked' })
            .in('id', allSlotIds);

        if (slotError) {
            console.error('Error updating slot status:', slotError);
        }

        setLoading(false);
        setConfirmed(true);
    };

    if (confirmed) {
        return (
            <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-8 shadow-xl text-center">
                <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-green-400 text-4xl">check_circle</span>
                </div>
                <h2 className="text-white text-2xl font-bold mb-4">Initial Interview Confirmed!</h2>
                <p className="text-[#9fc992] mb-8">
                    We have sent a confirmation email to <strong>{formData.email}</strong>.
                </p>

                {onlineLink && (
                    <div className="bg-[#2c4823]/30 p-4 rounded-lg inline-block mb-6">
                        <p className="text-xs text-[#9fc992] font-bold uppercase mb-1">Meeting Link</p>
                        <p className="text-white select-all">{onlineLink}</p>
                    </div>
                )}

                <Button onClick={() => window.location.reload()}>Book Another</Button>
            </div>
        );
    }

    return (
        <div className="bg-[#152211] border border-[#2c4823] rounded-2xl shadow-xl overflow-hidden">
            {/* Timezone Selector Header */}
            <div className="p-6 border-b border-[#2c4823] bg-[#2c4823]/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-white font-bold text-lg">Select a Date & Time</h2>
                <div className="w-full sm:w-auto min-w-[250px]">
                    <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-[#152211] border border-[#2c4823] rounded-lg px-3 py-2 text-white text-sm focus:ring-primary focus:border-primary"
                    >
                        {timezones.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row">
                {/* Left: Calendar */}
                <div className="w-full lg:w-[400px] p-6 border-b lg:border-b-0 lg:border-r border-[#2c4823]">
                    {/* Month Nav */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={handlePreviousMonth} className="p-2 hover:bg-white/10 rounded-full text-white">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <h3 className="text-white font-bold text-lg">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h3>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full text-white">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-[#9fc992] text-xs font-medium py-1">{day}</div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map(day => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const hasSlots = !!slotsByDate[dateKey];
                            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                            const isCurrentMonth = isSameMonth(day, currentMonth);

                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => handleDateClick(day)}
                                    disabled={!hasSlots}
                                    className={`
                                        h-10 w-10 mx-auto rounded-full flex items-center justify-center text-sm transition-colors relative
                                        ${!isCurrentMonth ? 'text-white/20' : 'text-white'}
                                        ${hasSlots && isCurrentMonth ? 'hover:bg-[#2c4823] cursor-pointer font-bold' : ''}
                                        ${!hasSlots ? 'opacity-20 cursor-default' : ''}
                                        ${isSelected ? 'bg-primary text-[#142210] font-bold hover:bg-primary opacity-100' : ''}
                                    `}
                                >
                                    {format(day, 'd')}
                                    {hasSlots && !isSelected && isCurrentMonth && (
                                        <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Slots & Form */}
                <div className="flex-1 p-6 bg-[#2c4823]/5">
                    {!selectedDate ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                            <div className="w-16 h-16 bg-[#2c4823] rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-[#9fc992] text-3xl">calendar_month</span>
                            </div>
                            <p className="text-white font-medium">Select a date to view available times</p>
                            <p className="text-[#9fc992] text-sm mt-1">Times will be shown in your time zone</p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="text-[#9fc992] font-normal">{format(selectedDate, 'EEEE, MMMM do')}</span>
                            </h3>

                            {!currentSlots.length ? (
                                <p className="text-white/60">No times available for this date.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 mb-8">
                                    {currentSlots.map(slot => {
                                        const date = new Date(slot.start_time);
                                        // Format time in selected TZ
                                        const timeStr = date.toLocaleTimeString('en-US', {
                                            hour: '2-digit', minute: '2-digit', timeZone: timezone || 'UTC'
                                        });
                                        const isSelected = selectedSlotId === slot.id;

                                        return (
                                            <button
                                                key={slot.id}
                                                onClick={() => setSelectedSlotId(slot.id)}
                                                className={`
                                                    px-4 py-3 rounded-lg border text-center font-bold transition-all
                                                    ${isSelected
                                                        ? 'bg-primary border-primary text-[#142210] shadow-[0_0_15px_rgba(159,201,146,0.3)]'
                                                        : 'bg-[#152211] border-[#2c4823] text-white hover:border-primary hover:text-primary'
                                                    }
                                                `}
                                            >
                                                {timeStr}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Candidate Form (Only show when slot selected) */}
                            {selectedSlotId && (
                                <div className="border-t border-[#2c4823] pt-6 mt-6 animate-in slide-in-from-bottom-4 duration-300">
                                    <h4 className="text-white font-bold mb-4">Your Details</h4>
                                    <div className="space-y-4">
                                        <Input label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        <Input label="Email Address" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        <Input label="Phone Number" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />

                                        <Button onClick={handleSubmit} fullWidth disabled={loading || !formData.name || !formData.email} className="mt-2">
                                            {loading ? 'Confirming...' : 'Confirm Booking'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Briefing Area */}
            {briefingText && (
                <div className="bg-[#2c4823]/10 border-t border-[#2c4823] p-6">
                    <h4 className="text-[#9fc992] text-xs font-bold uppercase mb-2">Instructions from Recruiter</h4>
                    <p className="text-white text-sm whitespace-pre-line">{briefingText}</p>
                    {files && files.length > 0 && (
                        <div className="flex gap-4 mt-3">
                            {files.map((f, i) => (
                                <a key={i} href={f.file_url} target="_blank" className="text-primary text-sm hover:underline flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">attach_file</span>
                                    {f.file_name}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
