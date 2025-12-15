import { createClient } from '@/lib/supabase/server';
import { Card } from '@/app/components/ui/Card';

export default async function RecruiterDashboard() {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Mock data for now if DB is empty, or fetch real data
    // In a real app, we'd join with companies table based on user's recruiter profile

    // Example fetch: count of templates
    const { count: templateCount } = await supabase
        .from('interview_templates')
        .select('*', { count: 'exact', head: true });

    // Example fetch: open slots
    const { count: openSlotsCount } = await supabase
        .from('slots')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Overview</h1>
                <div className="flex items-center gap-3">
                    <select
                        className="bg-[#152211] border border-[#2c4823] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5">
                        <option>All Hiring Companies</option>
                        {/* Map companies here */}
                    </select>
                    <select
                        className="bg-[#152211] border border-[#2c4823] text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5">
                        <option>Last 7 days</option>
                        <option value="30">Last 30 days</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                {/* Card 1 */}
                <Card className="p-5 h-32 flex flex-col justify-between">
                    <p className="text-[#9fc992] text-sm font-medium">Total Templates</p>
                    <p className="text-white text-3xl font-bold">{templateCount || 0}</p>
                </Card>
                {/* Card 2 */}
                <Card className="p-5 h-32 flex flex-col justify-between">
                    <p className="text-[#9fc992] text-sm font-medium">Open Slots</p>
                    <p className="text-white text-3xl font-bold">{openSlotsCount || 0}</p>
                </Card>
                {/* Card 3 */}
                <Card className="p-5 h-32 flex flex-col justify-between">
                    <p className="text-[#9fc992] text-sm font-medium">Unbooked %</p>
                    <p className="text-white text-3xl font-bold">--%</p>
                </Card>
                {/* Card 4 */}
                <Card className="p-5 h-32 flex flex-col justify-between">
                    <p className="text-[#9fc992] text-sm font-medium">Avg Time to Book</p>
                    <p className="text-white text-3xl font-bold">--<span className="text-base text-[#9fc992] ml-1 font-normal">days</span></p>
                </Card>
                {/* Card 5 */}
                <Card className="p-5 h-32 flex flex-col justify-between">
                    <p className="text-[#9fc992] text-sm font-medium">Manager Sync</p>
                    <div className="flex items-end gap-2">
                        <p className="text-white text-3xl font-bold">--</p>
                        <p className="text-[#9fc992] text-sm mb-1.5">synced</p>
                    </div>
                </Card>
            </div>

            {/* Recent Activity Table (Placeholder backed by structure) */}
            <div className="bg-[#152211] border border-[#2c4823] rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-[#2c4823]">
                    <h3 className="text-white text-lg font-bold">Recent Activity</h3>
                </div>
                <div className="overflow-x-auto">
                    <div className="p-8 text-center text-[#9fc992]">
                        No recent activity found.
                    </div>
                </div>
            </div>
        </div>
    );
}
