import { AppShell } from '@/app/components/layout/AppShell';

export default function RecruiterMainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppShell role="recruiter">
            {children}
        </AppShell>
    );
}
