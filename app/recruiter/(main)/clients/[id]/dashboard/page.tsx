import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ClientHeader } from '@/app/components/clients/ClientHeader';
import { TemplateList } from '@/app/components/clients/TemplateList';
import { TemplateDetail } from '@/app/components/clients/TemplateDetail';
import { RecentClientTracker } from '@/app/components/clients/RecentClientTracker';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ templateId?: string }>;
}

export default async function ClientDashboardPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { templateId } = await searchParams;
    const supabase = await createClient();

    // 1. Fetch Client Details
    const { data: client } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

    if (!client) {
        return notFound();
    }

    // 2. Fetch Base Data (Templates, etc)
    const [
        { data: managers },
        { data: templates },
        { data: departments },
    ] = await Promise.all([
        supabase.from('hiring_managers').select('*').eq('company_id', id).order('name'),
        supabase.from('interview_templates').select('*').eq('company_id', id).order('created_at', { ascending: false }),
        supabase.from('departments').select('*').eq('company_id', id).order('name'),
    ]);

    // 3. Fetch Selected Template Data (Bookings)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let selectedTemplateBookings: any[] = [];

    const activeId = templateId;

    if (activeId) {
        const { data: bData } = await supabase
            .from('bookings')
            .select('*, slots(start_time, hiring_managers(name))')
            .eq('template_id', activeId)
            .order('created_at', { ascending: false });

        selectedTemplateBookings = bData || [];
    }


    return (
        <div className="max-w-7xl mx-auto pb-20 h-[calc(100vh-100px)] flex flex-col">
            <RecentClientTracker clientId={id} />
            {/* Header */}
            <div className="flex-shrink-0 mb-6">
                <ClientHeader client={client} />
            </div>

            {/* Master-Detail Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">

                {/* Left Column: Template List (Master) */}
                <div className="lg:col-span-1 h-full min-h-0">
                    <TemplateList
                        templates={templates || []}
                        company={client}
                        managers={managers || []}
                        departments={departments || []}
                    />
                </div>

                {/* Right Column: Detail Widgets */}
                <div className="lg:col-span-3 h-full min-h-0 overflow-hidden flex flex-col">
                    {activeId ? (
                        <TemplateDetail
                            templateId={activeId}
                            bookings={selectedTemplateBookings}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-[#152211]/50 border border-[#2c4823] dashed rounded-2xl text-center p-8">
                            <span className="material-symbols-outlined text-6xl text-[#2c4823] mb-4">ads_click</span>
                            <h3 className="text-xl font-bold text-white mb-2">Select a Vacancy</h3>
                            <p className="text-[#9fc992] max-w-md">
                                Choose a template from the list on the left to manage candidates, interviews, and view activity.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
