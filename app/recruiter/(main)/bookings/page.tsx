import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Header } from '@/app/components/layout/Header';

export default async function BookingsPage() {
    const supabase = await createClient();

    // Fetch Bookings with related details
    // Note: Supabase nested joins syntax
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
            *,
            slots (
                start_time,
                end_time,
                interview_templates (name),
                hiring_managers (name, email)
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching bookings:', error);
        return (
            <div className="flex flex-col h-screen">
                <Header title="Bookings" />
                <main className="flex-1 p-8">
                    <div className="p-8 text-red-500">Error loading bookings.</div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <Header
                title="Bookings"
                actions={
                    <Link href="/recruiter/bookings/new" className="flex items-center justify-center px-4 py-2 bg-primary text-[#142210] font-bold rounded-full hover:bg-primary/90 transition-colors text-sm">
                        <span className="material-symbols-outlined mr-1 text-lg">add</span>
                        Create Booking
                    </Link>
                }
            />

            <main className="flex-1 p-8 overflow-y-auto">
                {bookings && bookings.length === 0 ? (
                    <div className="bg-[#152211] border border-[#2c4823] rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 bg-[#2c4823]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-[#9fc992] text-3xl">calendar_today</span>
                        </div>
                        <h3 className="text-white text-lg font-bold mb-2">No Bookings Yet</h3>
                        <p className="text-[#9fc992]">When candidates schedule interviews, they will appear here.</p>
                    </div>
                ) : (
                    <div className="bg-[#152211] border border-[#2c4823] rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-[#2c4823]/20 text-xs uppercase font-bold text-white">
                                    <tr>
                                        <th className="px-6 py-4">Candidate</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Date & Time</th>
                                        <th className="px-6 py-4">Template</th>
                                        <th className="px-6 py-4">Interviewer</th>
                                        <th className="px-6 py-4">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2c4823]">
                                    {bookings?.map((booking: any) => {
                                        const slot = booking.slots;
                                        const template = slot?.interview_templates;
                                        const manager = slot?.hiring_managers;
                                        const date = new Date(slot?.start_time);

                                        return (
                                            <tr key={booking.id} className="hover:bg-[#2c4823]/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-white">{booking.candidate_name}</div>
                                                    <div className="text-xs">{booking.candidate_email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                        ${booking.status === 'confirmed' ? 'bg-green-900/30 text-green-400 border-green-800' :
                                                            booking.status === 'cancelled' ? 'bg-red-900/30 text-red-400 border-red-800' :
                                                                'bg-yellow-900/30 text-yellow-400 border-yellow-800'}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-white">
                                                        {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </div>
                                                    <div className="text-xs">
                                                        {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} -
                                                        {new Date(slot?.end_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-white">
                                                    {template?.name || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-white">{manager?.name}</div>
                                                    <div className="text-xs">{manager?.email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    {new Date(booking.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
