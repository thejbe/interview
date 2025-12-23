
import { createClient } from '@/lib/supabase/server';
import { ClientForm } from '@/app/components/clients/ClientForm';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ClientEditorPage({ params }: PageProps) {
    const { id } = await params;
    const isNew = id === 'new';
    const supabase = await createClient();

    let client = null;
    let departments: any[] = [];
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
        <div>
            <header className="flex items-center gap-4 mb-8">
                <Link href={isNew ? "/recruiter/clients" : `/recruiter/clients/${id}/dashboard`} className="text-white/60 hover:text-white">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {isNew ? 'Add Client' : 'Edit Client'}
                </h1>
            </header>

            <ClientForm
                mode={isNew ? 'create' : 'edit'}
                initialData={client}
                initialDepartments={departments}
                initialManagers={managers}
            />
        </div>
    );
}
