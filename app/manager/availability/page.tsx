import { createClient } from '@/lib/supabase/server';
import { AvailabilityGrid } from '@/app/components/manager/AvailabilityGrid';
import { Button } from '@/app/components/ui/Button';

export default async function ManagerAvailabilityPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Middleware should handle this, but safe check
        return <div>Access Denied</div>;
    }

    // Get Manager Profile
    const { data: manager } = await supabase.from('hiring_managers').select('*').eq('auth_user_id', user.id).single();

    let slots: any[] = [];
    if (manager) {
        const { data } = await supabase.from('slots').select('*').eq('hiring_manager_id', manager.id);
        slots = data || [];
    } else {
        // If manager profile doesn't exist yet (first login?), created placeholders or handle error?
        // We will assume creation happens elsewhere or we just show empty.
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Availability Management</h1>

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
        </div>
    );
}
