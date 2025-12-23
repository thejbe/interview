import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Header } from '@/app/components/layout/Header';
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

    const Title = (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <span className="material-symbols-outlined text-primary text-sm">business</span>
            </div>
            <h1 className="text-lg font-bold text-black dark:text-white">{client.name}</h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${client.active ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>
                {client.active ? 'Active' : 'Archived'}
            </span>
        </div>
    );

    const Actions = (
        <Link
            href={`/recruiter/clients/${client.id}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2c4823] bg-[#152211] text-[#9fc992] hover:text-white hover:border-primary/50 transition-all font-medium text-xs"
        >
            <span className="material-symbols-outlined text-sm">settings</span>
            Settings
        </Link>
    );


    return (
        <div className="flex flex-col h-screen">
            <RecentClientTracker clientId={id} />

            <Header title={Title} actions={Actions} />

            <main className="flex-1 p-8 overflow-hidden h-full flex flex-col min-h-0">
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
            </main>
        </div>
    );
}
