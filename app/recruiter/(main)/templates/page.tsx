import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function TemplatesPage() {
    const supabase = await createClient();

    // Fetch templates with company and managers
    // Note: We're navigating FKs. 
    // 'companies' is referenced by company_id
    // 'template_hiring_managers' connects to 'hiring_managers'
    const { data: templates } = await supabase
        .from('interview_templates')
        .select(`
      *,
      companies ( name ),
      template_hiring_managers (
        hiring_managers ( name, email, role )
      )
    `)
        .order('created_at', { ascending: false });

    return (
        <div>
            {/* Header / Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Templates</h1>
                <div className="flex items-center gap-3">
                    <Link href="/recruiter/templates/new"
                        className="flex items-center justify-center px-4 py-2 bg-primary text-[#142210] font-bold rounded-full hover:bg-primary/90 transition-colors">
                        <span className="material-symbols-outlined mr-2">add</span>
                        Create new template
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#152211] border border-[#2c4823] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-[#9fc992] uppercase bg-[#2c4823]/20">
                            <tr>
                                <th scope="col" className="px-6 py-3">Template Name</th>
                                <th scope="col" className="px-6 py-3">Hiring Company</th>
                                <th scope="col" className="px-6 py-3">Length</th>
                                <th scope="col" className="px-6 py-3">Location</th>
                                <th scope="col" className="px-6 py-3">Managers</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates && templates.length > 0 ? (
                                templates.map((template) => (
                                    <tr key={template.id} className="border-b border-[#2c4823] hover:bg-[#2c4823]/10">
                                        <td className="px-6 py-4 font-medium text-white">{template.name}</td>
                                        <td className="px-6 py-4">
                                            {/* @ts-ignore - relational data types usually inferred but explicit types pending */}
                                            {template.companies?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">{template.interview_length_minutes} min</td>
                                        <td className="px-6 py-4 capitalize">{template.location_type?.replace('_', ' ')}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex -space-x-2">
                                                {/* @ts-ignore */}
                                                {template.template_hiring_managers?.slice(0, 3).map((thm: any, idx: number) => (
                                                    <div key={idx}
                                                        title={`${thm.hiring_managers?.name} ${thm.hiring_managers?.role ? `(${thm.hiring_managers.role})` : ''}`}
                                                        className="w-6 h-6 rounded-full bg-gray-500 border border-[#152211] flex items-center justify-center text-xs text-white">
                                                        {thm.hiring_managers?.name?.[0] || 'U'}
                                                    </div>
                                                ))}
                                                {/* @ts-ignore */}
                                                {(template.template_hiring_managers?.length || 0) > 3 && (
                                                    <div className="w-6 h-6 rounded-full bg-gray-700 border border-[#152211] flex items-center justify-center text-[10px] text-white">
                                                        +{(template.template_hiring_managers?.length || 0) - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${template.active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                                {template.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/recruiter/templates/${template.id}`} className="text-primary hover:underline mr-3">
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-[#9fc992]">
                                        No templates found. Create one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
