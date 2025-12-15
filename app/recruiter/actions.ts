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
