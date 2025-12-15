'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ... existing imports ...

export async function markAvailabilityProvided(templateId: string, managerId: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('template_hiring_managers')
            .update({ availability_status: 'provided' })
            .eq('template_id', templateId)
            .eq('hiring_manager_id', managerId);

        if (error) throw error;

        revalidatePath('/manager/availability');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update status:', error);
        return { success: false, message: error.message };
    }
}

export async function markAllRequestsProvided(managerId: string) {
    const supabase = await createClient();

    try {
        // Update all pending/requested records for this manager
        // We target all because 'Save Availability' implies "I'm ready for anything I've been asked for"
        // in the context of the generic daily overview.
        const { error } = await supabase
            .from('template_hiring_managers')
            .update({ availability_status: 'provided' })
            .eq('hiring_manager_id', managerId)
            .neq('availability_status', 'provided'); // Only update if not already provided? Or just force set.
        // .in('availability_status', ['pending', 'requested']); // Optional refinement

        if (error) throw error;

        revalidatePath('/manager/availability');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update all statuses:', error);
        return { success: false, message: error.message };
    }
}
