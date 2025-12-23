
import { redirect } from 'next/navigation';
import { getRecentClientIds } from '@/app/actions/navigation';

export default async function RecruiterHomePage() {
    const recentIds = await getRecentClientIds();

    if (recentIds.length > 0) {
        redirect(`/recruiter/clients/${recentIds[0]}/dashboard`);
    } else {
        redirect('/recruiter/clients');
    }
}
