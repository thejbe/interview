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

    // Fetch Companies and Managers for dropdowns
    const { data: companies } = await supabase.from('companies').select('*');
    const { data: managers } = await supabase.from('hiring_managers').select('*');

    let template = null;
    let candidates: any[] = [];

    if (!isNew) {
        const { data } = await supabase
            .from('interview_templates')
            .select('*, template_hiring_managers(hiring_manager_id)')
            .eq('id', id)
            .single();
        template = data;

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
            <header className="flex items-center gap-4 mb-8">
                <Link href="/recruiter/templates" className="text-white/60 hover:text-white">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {isNew ? 'Create New Template' : 'Edit Template'}
                </h1>
            </header>

            <TemplateForm
                mode={isNew ? 'create' : 'edit'}
                initialData={template}
                companies={companies || []}
                managers={managers || []}
            />

            {!isNew && (
                <CandidateManager
                    templateId={id}
                    candidates={candidates}
                    managers={managers || []}
                    durationPromise={template?.interview_length_minutes || 60}
                />
            )}
        </div>
    );
}
