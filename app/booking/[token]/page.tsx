import { createClient } from '@/lib/supabase/server';
import { BookingForm } from '@/app/components/booking/BookingForm';

interface PageProps {
    params: Promise<{ token: string }>;
}

export default async function BookingPage({ params }: PageProps) {
    const { token } = await params;
    const supabase = await createClient();

    let templateId = token;
    let booking = null;

    // 1. Try to find an invite/booking with this token
    const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('token', token)
        .single();

    if (bookingData) {
        booking = bookingData;
        templateId = bookingData.template_id;

        // If already confirmed, simple view (Phase 2 scope: just show message or let them re-view?)
        // The form handles "confirmed" state, but maybe we should redirect or show a status here?
        // For now, pass to form, let form handle "Already Booked" if needed.
    }

    // 2. Fetch template
    const { data: template } = await supabase
        .from('interview_templates')
        .select('*, companies(name)')
        .eq('id', templateId)
        .single();

    if (!template) {
        return <div className="text-white text-center p-10">Template not found or invalid link.</div>;
    }

    // Fetch template managers to get rules
    const { data: templateManagers } = await supabase
        .from('template_hiring_managers')
        .select('hiring_manager_id, role_type')
        .eq('template_id', templateId);

    const mandatoryManagers = templateManagers?.filter(m => m.role_type === 'mandatory').map(m => m.hiring_manager_id) || [];
    const atLeastOneManagers = templateManagers?.filter(m => m.role_type === 'at_least_one').map(m => m.hiring_manager_id) || [];
    const requiredCount = template.required_interviewers_count || 1;

    // Fetch open slots with hiring manager info
    const { data: rawSlots } = await supabase
        .from('slots')
        .select('*')
        .eq('template_id', templateId)
        .eq('status', 'open')
        .gte('start_time', new Date().toISOString()) // Only future slots
        .order('start_time', { ascending: true });

    // Group slots by start time
    const slotsByTime: Record<string, NonNullable<typeof rawSlots>> = {};
    (rawSlots || []).forEach(slot => {
        const time = slot.start_time;
        if (!slotsByTime[time]) slotsByTime[time] = [];
        slotsByTime[time]?.push(slot);
    });

    // Filter for valid panels
    const validPanelSlots: any[] = [];

    Object.entries(slotsByTime).forEach(([time, slots]) => {
        // 1. Check Count
        if (slots.length < requiredCount) return;

        const managerIds = slots.map(s => s.hiring_manager_id);

        // 2. Check Mandatory
        const distinctMandatory = mandatoryManagers.filter((id: any) => managerIds.includes(id));
        if (distinctMandatory.length !== mandatoryManagers.length) return; // Missing some mandatory

        // 3. Check At Least One (if any are defined)
        if (atLeastOneManagers.length > 0) {
            const hasAtLeastOne = atLeastOneManagers.some((id: any) => managerIds.includes(id));
            if (!hasAtLeastOne) return;
        }

        // 4. Construct valid panel
        // We need to pick exactly 'requiredCount' slots to book.
        // Priority: Mandatory -> At Least One -> Optional
        // But simply taking the first N including mandatories is usually fine, 
        // as long as we satisfy the rules.

        // Sort slots by priority: Mandatory < AtLeastOne < Optional
        slots.sort((a, b) => {
            const getPriority = (id: string) => {
                if (mandatoryManagers.includes(id)) return 0;
                if (atLeastOneManagers.includes(id)) return 1;
                return 2;
            };
            return getPriority(a.hiring_manager_id) - getPriority(b.hiring_manager_id);
        });

        const selectedSlots = slots.slice(0, requiredCount);

        // Double check the selected subset still satisfies rules (it should if logic is correct)

        // Create composite slot for the UI
        validPanelSlots.push({
            id: selectedSlots[0].id, // Primary ID
            additional_slot_ids: selectedSlots.slice(1).map(s => s.id), // Others
            start_time: time,
            end_time: selectedSlots[0].end_time,
            status: 'open'
        });
    });

    // Fetch files (mock query or real relation)
    // const { data: files } = await supabase.from('template_files').select('*').eq('template_id', template.id);

    return (
        <div className="min-h-screen p-4 md:p-8 flex flex-col items-center relative overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a2e16] via-[#142210] to-[#142210] -z-10"></div>

            <div className="max-w-3xl w-full mx-auto z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#152211] border border-[#2c4823] mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">videocam</span>
                    </div>
                    <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Interview for {template.name}</h1>
                    <p className="text-[#9fc992] text-lg">{template.interview_length_minutes} minute {template.location_type} interview with {template.companies?.name}</p>
                </div>

                <BookingForm
                    slots={validPanelSlots || []}
                    templateId={template.id}
                    briefingText={template.candidate_briefing_text}
                    existingBooking={booking}
                    onlineLink={template.online_link}
                // files={files || []}
                />

                <footer className="mt-12 text-center text-[#9fc992]/40 text-sm font-medium">
                    Secure scheduling powered by Stitch
                </footer>
            </div>
        </div>
    );
}
