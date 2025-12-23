import { createClient } from '@/lib/supabase/server';
import { BookingEntryForm } from '@/app/components/booking/BookingEntryForm';
import Link from 'next/link';

export default async function NewBookingPage() {
    const supabase = await createClient();

    // Fetch active templates
    const { data: templates } = await supabase
        .from('interview_templates')
        .select('id, name, companies(name)')
        .eq('active', true)
        .order('created_at', { ascending: false });

    return (
        <div className="pb-24">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/recruiter/bookings" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#152211] border border-[#2c4823] text-white hover:bg-[#2c4823] transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Booking</h1>
            </div>

            <BookingEntryForm templates={templates || []} />
        </div>
    );
}
