"use client";

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Slot {
    id: string;
    start_time: string;
    end_time: string;
    status: 'open' | 'booked' | 'blocked';
    source: 'calendar' | 'override';
}

interface AvailabilityGridProps {
    initialSlots: Slot[];
    managerId: string;
}

export function AvailabilityGrid({ initialSlots, managerId }: AvailabilityGridProps) {
    const [slots, setSlots] = useState<Slot[]>(initialSlots);
    const router = useRouter();
    const supabase = createClient();

    // Drag State
    const [isDragging, setIsDragging] = useState(false);
    const dragMode = useRef<'open' | 'blocked' | null>(null);
    const pendingUpdates = useRef<Map<string, Partial<Slot>>>(new Map()); // Map ID -> Changes
    const pendingInserts = useRef<any[]>([]); // List of new slots to insert

    const hours = [9, 10, 11, 12, 13, 14, 15, 16]; // 9 AM to 5 PM
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    // For V1 demo, we just align "Mon" to a specific date or just pretend relative to "Next Week"
    // We'll assume the current view is for "Next Week" starting a specific Monday.
    const baseDate = new Date(); // Today
    // Logic to find next Monday would go here. For simplicity, we just use abstract "Day 0 - Day 4" offsets.

    const getSlot = (dayIndex: number, hour: number) => {
        // This is a naive check, in real app we'd compare actual timestamps
        // For prototype, we can check if any slot starts at this approximate time?
        // Let's rely on visual state management rather than complex date math for the V1 grid if possible, 
        // OR we just map slots to day/hour based on getDay() and getHours().

        return slots.find(s => {
            const d = new Date(s.start_time);
            // Adjust for timezone in real app
            const day = d.getDay() - 1; // Mon=1 -> 0
            const h = d.getHours();
            return day === dayIndex && h === hour;
        });
    };

    // -- Drag & Update Logic --

    const updateSlot = (dayIndex: number, hour: number, mode: 'open' | 'blocked') => {
        const existingSlot = getSlot(dayIndex, hour);

        // Optimistic Update Data
        let match = false;
        if (existingSlot) {
            // If it already matches our desired mode, skip
            if (existingSlot.status === mode && existingSlot.source === 'override') match = true;
        }

        if (match) return; // No change needed

        if (existingSlot) {
            // Update Existing
            const updatedSlot: Slot = { ...existingSlot, status: mode, source: 'override' };
            setSlots(prev => prev.map(s => s.id === existingSlot.id ? updatedSlot : s));

            // Track for DB
            pendingUpdates.current.set(existingSlot.id, { status: mode, source: 'override' });
        } else {
            // Create New
            const d = new Date();
            const dayOfWeek = d.getDay();
            const diff = d.getDate() - dayOfWeek + (dayOfWeek == 0 ? -6 : 1) + 7; // Next Monday
            const monday = new Date(d.setDate(diff));
            monday.setHours(hour, 0, 0, 0);
            monday.setDate(monday.getDate() + dayIndex);

            const startTime = monday.toISOString();
            monday.setHours(hour + 1);
            const endTime = monday.toISOString();

            const tempId = `temp-${Date.now()}-${Math.random()}`;
            const newSlot: Slot = {
                id: tempId,
                start_time: startTime,
                end_time: endTime,
                status: mode,
                source: 'override'
            } as Slot; // Casting because ID is temp

            setSlots(prev => [...prev, newSlot]);

            // Track for insert
            // We need to distinguish this from updates. Ideally we push to pendingInserts.
            // But if we drag over it again?
            // Since it's temp, we can store it in a map. If we change it again, we update the map entry.
            // Actually, simpler: just treat everything as "last state wins".
            // For inserts, we need the payload.
            pendingInserts.current.push({
                tempId,
                hiring_manager_id: managerId,
                start_time: startTime,
                end_time: endTime,
                status: mode,
                source: 'override'
            });
        }
    };

    const commitChanges = async () => {
        const updates = Array.from(pendingUpdates.current.entries()).map(([id, changes]) => ({
            id,
            ...changes
        }));

        const inserts = pendingInserts.current;

        // Clear refs immediately to avoid double send
        pendingUpdates.current = new Map();
        pendingInserts.current = [];

        if (updates.length > 0) {
            // Upsert or Update (Upsert works if we have all fields, but we only have partial. Update is safer for partial)
            // Supabase doesn't support bulk update with different values easily without upsert.
            // For V1, Promise.all is acceptable.
            await Promise.all(updates.map(u => supabase.from('slots').update(u).eq('id', u.id)));
        }

        if (inserts.length > 0) {
            // Clean tempIds
            const cleanInserts = inserts.map(({ tempId, ...rest }) => rest);
            await supabase.from('slots').insert(cleanInserts);
        }

        router.refresh();
    };

    // -- Mouse Handlers --

    const handleMouseDown = (dayIndex: number, hour: number) => {
        setIsDragging(true);
        const slot = getSlot(dayIndex, hour);

        // Determine Mode
        // If empty or blocked -> Open
        // If open -> Blocked
        const initialMode = (slot?.status === 'open') ? 'blocked' : 'open';
        dragMode.current = initialMode;

        updateSlot(dayIndex, hour, initialMode);
    };

    const handleMouseEnter = (dayIndex: number, hour: number) => {
        if (!isDragging || !dragMode.current) return;
        updateSlot(dayIndex, hour, dragMode.current);
    };

    const handleMouseUp = async () => {
        setIsDragging(false);
        dragMode.current = null;
        await commitChanges();
    };

    // Global MouseUp to catch drag release outside grid
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) {
                handleMouseUp();
            }
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [isDragging]);

    return (
        <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-lg font-bold">Weekly Availability</h3>
                <div className="flex items-center gap-4 text-sm scale-90 origin-right md:scale-100">
                    <span className="flex items-center gap-2 text-white">
                        <span className="w-3 h-3 bg-[#2c4823]/40 rounded-sm"></span> Calendar Busy
                    </span>
                    <span className="flex items-center gap-2 text-white">
                        <span className="w-3 h-3 bg-[#2c4823] rounded-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]"></div>
                        </span> Manual Busy
                    </span>
                    <span className="flex items-center gap-2 text-white">
                        <span className="w-3 h-3 bg-primary/20 border border-primary rounded-sm"></span> Manual Free
                    </span>
                </div>
            </div>

            <p className="text-[#9fc992] text-sm mb-4">
                Click to toggle: Available <span className="text-xs">➜</span> Blocked <span className="text-xs">➜</span> Clear
            </p>

            {/* Grid */}
            <div className="grid grid-cols-6 gap-2 text-center text-sm text-white">
                <div className="py-2 font-bold text-[#9fc992]">Time</div>
                {days.map(d => <div key={d} className="py-2 font-bold">{d}</div>)}

                {hours.map(hour => (
                    <div key={hour} className="contents">
                        <div className="text-right pr-2 text-[#9fc992] text-xs py-3 flex items-center justify-end">
                            {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                        </div>
                        {days.map((_, dayIndex) => {
                            const slot = getSlot(dayIndex, hour);
                            // Styles based on status/source
                            let slotClass = "bg-[#2c4823]/40 hover:bg-[#2c4823] group relative"; // Default / Empty
                            if (slot) {
                                if (slot.status === 'open') {
                                    slotClass = "bg-primary/20 border border-primary text-primary";
                                } else if (slot.status === 'blocked' && slot.source === 'override') {
                                    slotClass = "bg-[#2c4823] relative overflow-hidden"; // Manual Busy styling needs gradient
                                } else if (slot.status === 'blocked' && slot.source === 'calendar') {
                                    slotClass = "bg-[#2c4823]/60"; // Calendar Busy
                                }
                            }

                            return (
                                <button
                                    key={`${dayIndex}-${hour}`}
                                    onMouseDown={() => handleMouseDown(dayIndex, hour)}
                                    onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                                    className={`rounded p-1 h-10 flex items-center justify-center cursor-pointer transition-colors w-full select-none ${slotClass}`}
                                >
                                    {/* Gradient overlay for Manual Busy */}
                                    {slot?.status === 'blocked' && slot.source === 'override' && (
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]"></div>
                                    )}

                                    {/* Label for debugging or status */}
                                    {slot?.status === 'open' && <span className="material-symbols-outlined text-xs">check</span>}
                                    {slot?.status === 'blocked' && <span className="material-symbols-outlined text-xs opacity-50">block</span>}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
