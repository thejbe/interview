import { createClient } from '@/lib/supabase/server';
import { BookingForm } from '@/app/components/booking/BookingForm';

interface PageProps {
    params: Promise<{ token: string }>;
}

export default async function BookingPage({ params }: PageProps) {
    const { token } = await params;
    const templateId = token; // Assuming token is templateId for V1
    const supabase = await createClient();

    // Fetch template
    const { data: template } = await supabase
        .from('interview_templates')
        .select('*, companies(name)')
        .eq('id', templateId)
        .single();

    if (!template) {
        return <div className="text-white text-center p-10">Template not found or invalid link.</div>;
    }

    // Fetch open slots
    const { data: slots } = await supabase
        .from('slots')
        .select('*')
        .eq('template_id', templateId)
        .eq('status', 'open')
        .gte('start_time', new Date().toISOString()) // Only future slots
        .order('start_time', { ascending: true });

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
                    slots={slots || []}
                    templateId={template.id}
                    briefingText={template.candidate_briefing_text}
                // files={files || []}
                />

                <footer className="mt-12 text-center text-[#9fc992]/40 text-sm font-medium">
                    Secure scheduling powered by Stitch
                </footer>
            </div>
        </div>
    );
}
