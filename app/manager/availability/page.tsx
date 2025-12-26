import { createClient } from '@/lib/supabase/server';
import { AvailabilityGrid } from '@/app/components/manager/AvailabilityGrid';
import { Button } from '@/app/components/ui/Button';
import { markAvailabilityProvided, markAllRequestsProvided } from '@/app/manager/actions';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

interface PageProps {
    searchParams: Promise<{ template_id?: string }>;
}

export default async function ManagerAvailabilityPage({ searchParams }: PageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { template_id } = await searchParams;

    if (!user) {
        return <div>Access Denied</div>;
    }

    // Get Manager Profile
    let { data: manager } = await supabase.from('hiring_managers').select('*').eq('auth_user_id', user.id).single();

    // Auto-link logic: If not found by ID, try to find by email and link
    if (!manager && user.email) {
        const { data: existingManager } = await supabase
            .from('hiring_managers')
            .select('*')
            .eq('email', user.email)
            .single();

        if (existingManager) {
            // Found by email! Link the account.
            const { data: linkedManager, error: linkError } = await supabase
                .from('hiring_managers')
                .update({ auth_user_id: user.id })
                .eq('id', existingManager.id)
                .select()
                .single();

            if (!linkError && linkedManager) {
                manager = linkedManager;
            }
        }
    }

    if (!manager) {
        // Fallback or Error State logic
        // Ideally we might try to link by email here if not linked, but for now just safe guard
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-4">Manager Profile Not Found</h1>
                <p className="text-white mb-4">
                    We couldn&apos;t find a hiring manager profile linked to your account.
                </p>
                <div className="text-sm text-gray-400">
                    User Email: {user.email}<br />
                    User ID: {user.id}
                </div>
            </div>
        );
    }

    let slots: any[] = [];
    if (manager) {
        const { data } = await supabase.from('slots').select('*').eq('hiring_manager_id', manager.id);
        slots = data || [];
    }

    // Fetch Template Context if ID provided
    let templateContext = null;
    if (template_id) {
        const { data } = await supabase.from('interview_templates').select('name').eq('id', template_id).single();
        templateContext = data;
    }

    async function handleDone() {
        'use server';
        if (template_id && manager?.id) {
            await markAvailabilityProvided(template_id, manager.id);
            redirect('/manager/availability'); // clear params
        } else if (manager?.id) {
            // General save - mark all as provided
            await markAllRequestsProvided(manager.id);
            revalidatePath('/manager/availability');
            redirect('/manager/availability');
        }
    }

    return (
        <div>
            {/* Request Context Banner */}
            {templateContext && (
                <div className="bg-primary/10 border border-primary rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">Availability Request</h2>
                        <p className="text-[#9fc992]">Please set your availability for the <span className="text-white font-bold">{templateContext.name}</span> interview loop.</p>
                    </div>
                    <form action={handleDone}>
                        <Button type="submit">
                            <span className="material-symbols-outlined mr-2">check_circle</span>
                            I&apos;m Done
                        </Button>
                    </form>
                </div>
            )}

            {/* Request Context Banner */}

            {/* Calendar Connection */}
            <section className="mb-8">
                <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-6">
                    <h3 className="text-white text-lg font-bold mb-4">Calendar Connection</h3>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button variant="ghost" className="bg-white text-black hover:bg-gray-200">
                            <span className="material-symbols-outlined mr-2 text-blue-500">calendar_month</span>
                            Connect Google Calendar
                        </Button>
                        <Button variant="ghost" className="bg-[#0078d4] text-white hover:bg-[#0078d4]/80">
                            <span className="material-symbols-outlined mr-2">mail</span>
                            Connect Outlook
                        </Button>
                    </div>
                    {manager?.calendar_provider !== 'none' && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-[#9fc992]">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            Connected to {manager?.calendar_provider} · Last sync recently
                        </div>
                    )}
                    {manager?.calendar_provider === 'none' && (
                        <div className="mt-4 text-xs text-gray-400">Not connected to any calendar provider.</div>
                    )}
                </div>
            </section>

            {/* Grid */}
            <AvailabilityGrid initialSlots={slots} managerId={manager?.id || ''} />

            {/* Bottom Save Action - Always visible now */}
            <div className="mt-8 flex justify-end pb-12">
                <form action={handleDone}>
                    <Button type="submit" className="px-8 font-bold text-lg">
                        <span className="material-symbols-outlined mr-2">check_circle</span>
                        Save Availability
                    </Button>
                </form>
            </div>
        </div>
    );
}
