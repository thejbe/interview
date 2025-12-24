import { AppShell } from '@/app/components/layout/AppShell';
import { createClient } from '@/lib/supabase/server';
import { getRecentClientIds } from '@/app/actions/navigation';

export default async function RecruiterMainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const recentIds = await getRecentClientIds();

    // Fetch data in parallel
    const [{ data: userSession }, { data: allClients }, { data: recentClientsData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('companies').select('id, name').order('name'),
        recentIds.length > 0
            ? supabase.from('companies').select('id, name').in('id', recentIds)
            : Promise.resolve({ data: [] })
    ]);

    // Fetch recruiter profile details
    let recruiterProfile = null;
    if (userSession?.user) {
        const { data: rec } = await supabase
            .from('recruiters')
            .select('name, role, avatar_url, email')
            .eq('auth_user_id', userSession.user.id)
            .single();
        recruiterProfile = rec;
    }

    // Sort recent clients to match the order of IDs in the cookie
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentClients = recentIds.map(id => recentClientsData?.find((c: any) => c.id === id)).filter(Boolean);

    return (
        <AppShell
            role="recruiter"
            user={recruiterProfile}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recentClients={recentClients as any[]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            allClients={allClients as any[]}
        >
            {children}
        </AppShell>
    );
}
