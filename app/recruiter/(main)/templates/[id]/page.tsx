import { createClient } from '@/lib/supabase/server';
import { TemplateForm } from '@/app/components/templates/TemplateForm';
import { CandidateManager } from '@/app/components/templates/CandidateManager';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TemplateEditorPage({ params }: PageProps) {
    const { id } = await params;
    const isNew = id === 'new';
    const supabase = await createClient();

    // Function to fetch template data
    const fetchTemplate = async () => {
        if (isNew) {
            return null;
        }
        const { data } = await supabase
            .from('interview_templates')
            .select('*, template_hiring_managers(hiring_manager_id, role_type, list_order)')
            .eq('id', id)
            .single();
        return data;
    };

    // Parallelize fetches
    const [
        { data: companies },
        { data: managers },
        { data: departments }, // Fetch departments
        templateData
    ] = await Promise.all([
        supabase.from('companies').select('id, name').order('name'),
        supabase.from('hiring_managers').select('id, name, email, role, company_id, department_id').eq('active', true).order('name'),
        supabase.from('departments').select('id, name, company_id').order('name'), // Fetch query
        fetchTemplate()
    ]);

    // Serialize for client component
    const safeTemplate = templateData ? JSON.parse(JSON.stringify(templateData)) : null;

    let candidates: any[] = [];
    if (!isNew) {
        // Fetch Candidates
        const { data: bookings } = await supabase
            .from('bookings')
            .select('*')
            .eq('template_id', id)
            .order('created_at', { ascending: false });
        candidates = bookings || [];
    }

    return (
        <div className="pb-24">

            <TemplateForm
                mode={isNew ? 'create' : 'edit'}
                companies={companies || []}
                managers={managers || []}
                departments={departments || []} // Pass departments
                initialData={safeTemplate}
            />

            {!isNew && (
                <CandidateManager
                    templateId={id}
                    candidates={candidates}
                    managers={managers || []}
                    durationPromise={safeTemplate?.interview_length_minutes || 60}
                />
            )}
        </div>
    );
}
