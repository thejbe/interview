
import { createClient } from '@/lib/supabase/server';
import { ClientForm } from '@/app/components/clients/ClientForm';
import Link from 'next/link';
import { Header } from '@/app/components/layout/Header';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ClientEditorPage({ params }: PageProps) {
    const { id } = await params;
    const isNew = id === 'new';
    const supabase = await createClient();

    let client = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let departments: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let managers: any[] = [];

    if (!isNew) {
        // Fetch Client
        const { data: clientData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', id)
            .single();
        client = clientData;

        // Fetch Departments
        const { data: deptData } = await supabase
            .from('departments')
            .select('*')
            .eq('company_id', id)
            .order('name');
        departments = deptData || [];

        // Fetch Managers
        const { data: mgrData } = await supabase
            .from('hiring_managers')
            .select('*')
            .eq('company_id', id)
            .order('name');
        managers = mgrData || [];
    }

    return (
        <div className="flex flex-col h-screen">
            <Header
                title={
                    <div className="flex items-center gap-4">
                        <Link href={isNew ? "/recruiter/clients" : `/recruiter/clients/${id}/dashboard`} className="flex items-center justify-center w-8 h-8 rounded-full bg-[#152211] border border-[#2c4823] text-white/60 hover:text-white hover:bg-[#2c4823] transition-all">
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                        </Link>
                        <h1 className="text-lg font-bold text-black dark:text-white">
                            {isNew ? 'Add Client' : 'Edit Client'}
                        </h1>
                    </div>
                }
            />

            <main className="flex-1 p-8 overflow-y-auto">
                <ClientForm
                    mode={isNew ? 'create' : 'edit'}
                    initialData={client || undefined}
                    initialDepartments={departments}
                    initialManagers={managers}
                />
            </main>
        </div>
    );
}
