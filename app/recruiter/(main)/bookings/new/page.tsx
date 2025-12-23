import { createClient } from '@/lib/supabase/server';
import { BookingEntryForm } from '@/app/components/booking/BookingEntryForm';
import Link from 'next/link';
import { Header } from '@/app/components/layout/Header';

export default async function NewBookingPage() {
    const supabase = await createClient();

    // Fetch active templates
    const { data: templates } = await supabase
        .from('interview_templates')
        .select('id, name, companies(name)')
        .eq('active', true)
        .order('created_at', { ascending: false });

    return (
        <div className="flex flex-col h-screen">
            <Header
                title={
                    <div className="flex items-center gap-4">
                        <Link href="/recruiter/bookings" className="w-8 h-8 flex items-center justify-center rounded-full bg-[#152211] border border-[#2c4823] text-white hover:bg-[#2c4823] transition-colors">
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                        </Link>
                        <h1 className="text-lg font-bold text-black dark:text-white">New Booking</h1>
                    </div>
                }
            />

            <main className="flex-1 p-8 overflow-y-auto">
                <BookingEntryForm templates={templates || []} />
            </main>
        </div>
    );
}
