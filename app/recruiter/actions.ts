'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getEmailTemplate(key: string) {
    const supabase = await createClient();
    const { data } = await supabase.from('email_templates').select('*').eq('key', key).single();
    return data;
}

export async function sendAvailabilityRequest(
    templateId: string,
    customSubject?: string,
    customBody?: string
) {
    const supabase = await createClient();

    try {
        // 1. Fetch Template & Managers
        const { data: template } = await supabase
            .from('interview_templates')
            .select('*, recruiters(first_name, last_name, email)')
            .eq('id', templateId)
            .single();

        if (!template) throw new Error('Template not found');

        const { data: managers } = await supabase
            .from('template_hiring_managers')
            .select('*, hiring_managers(id, name, email)')
            .eq('template_id', templateId);

        if (!managers || managers.length === 0) throw new Error('No managers found for this template');

        // 2. Fetch Email Template Defaults (if no custom provided)
        let subjectTemplate = customSubject;
        let bodyTemplate = customBody;

        if (!subjectTemplate || !bodyTemplate) {
            const { data: emailTemplate } = await supabase
                .from('email_templates')
                .select('*')
                .eq('key', 'availability_request')
                .single();

            if (!emailTemplate) throw new Error('Email template not found');
            subjectTemplate = subjectTemplate || emailTemplate.subject;
            bodyTemplate = bodyTemplate || emailTemplate.body;
        }

        // 3. "Send" Emails & Update Status
        const results = await Promise.all(managers.map(async (thm) => {
            const manager = thm.hiring_managers;
            if (!manager) return;

            // Generate Link (Mock)
            // In prod: `${process.env.NEXT_PUBLIC_BASE_URL}/manager/availability?template_id=${templateId}&manager_id=${manager.id}`
            const link = `http://localhost:3000/manager/availability?template_id=${templateId}`;

            // Replace variables
            let body = bodyTemplate!
                .replace('{{manager_name}}', manager.name)
                .replace('{{recruiter_name}}', `${template.recruiters?.first_name} ${template.recruiters?.last_name}`)
                .replace('{{template_name}}', template.name)
                .replace('{{link}}', link);

            let subject = subjectTemplate!.replace('{{template_name}}', template.name);

            // Simulate Send
            console.log('--- MOCK EMAIL SEND ---');
            console.log(`To: ${manager.email}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body:\n${body}`);
            console.log('-----------------------');

            // Update DB Status
            await supabase
                .from('template_hiring_managers')
                .update({
                    availability_status: 'requested',
                    last_request_sent_at: new Date().toISOString()
                })
                .eq('template_id', templateId)
                .eq('hiring_manager_id', manager.id);
        }));

        revalidatePath('/recruiter/templates');
        return { success: true, message: `Requests sent to ${managers.length} managers.` };
    } catch (error: any) {
        console.error('Failed to send requests:', error);
        return { success: false, message: error.message };
    }
}

export async function createCandidateInvite(
    templateId: string,
    name: string,
    email: string,
    meetingLink?: string,
    meetingPlatform?: string
) {
    const supabase = await createClient();

    try {
        // Generate a random token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const { data, error } = await supabase
            .from('bookings')
            .insert({
                template_id: templateId,
                candidate_name: name,
                candidate_email: email,
                token: token,
                status: 'pending',
                slot_id: null, // Explicitly null for invite
                timezone: 'UTC', // Default, will be updated by candidate
                meeting_link: meetingLink || null,
                meeting_platform: meetingPlatform || null
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath(`/recruiter/templates/${templateId}`);
        return { success: true, booking: data };
    } catch (error: any) {
        console.error('Failed to create invite:', error);
        return { success: false, message: error.message };
    }
}

export async function createManualBooking(
    bookingId: string,
    templateId: string,
    date: string,
    startTime: string, // "HH:MM"
    durationMinutes: number,
    managerIds: string[],
    meetingLink?: string,
    meetingPlatform?: string
) {
    const supabase = await createClient();

    try {
        // 1. Calculate Start/End ISO strings
        const startDateTime = new Date(`${date}T${startTime}:00Z`); // Treat as UTC for safety/consistency
        const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

        // 2. Create Slots for each manager (Override)
        const newSlots = [];
        for (const managerId of managerIds) {
            const { data: slot, error } = await supabase
                .from('slots')
                .insert({
                    template_id: templateId,
                    hiring_manager_id: managerId,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    status: 'booked', // Directly booked
                    source: 'override'
                })
                .select()
                .single();

            if (error) throw error;
            newSlots.push(slot);
        }

        if (newSlots.length === 0) throw new Error('No slots created');

        // 3. Update Booking
        const primarySlot = newSlots[0];
        const additionalSlots = newSlots.slice(1).map(s => s.id);

        const { error: bookingError } = await supabase
            .from('bookings')
            .update({
                slot_id: primarySlot.id,
                additional_slot_ids: additionalSlots,
                status: 'confirmed',
                timezone: 'UTC', // Default for override
                meeting_link: meetingLink || null,
                meeting_platform: meetingPlatform || null
            })
            .eq('id', bookingId);

        if (bookingError) throw bookingError;

        revalidatePath(`/recruiter/templates/${templateId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to manually book:', error);
        return { success: false, message: error.message };
    }
}
