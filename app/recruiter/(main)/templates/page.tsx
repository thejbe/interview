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
        hiring_manager_id,
        availability_status,
        hiring_managers ( name, email, role )
      )
    `)
        .order('created_at', { ascending: false });

    // Fetch all managers who have at least one open future slot
    const { data: slotsData } = await supabase
        .from('slots')
        .select('hiring_manager_id')
        .eq('status', 'open')
        .gte('start_time', new Date().toISOString());

    const availableManagerIds = new Set(slotsData?.map(s => s.hiring_manager_id));

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
                                <th scope="col" className="px-6 py-3">Availability</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates && templates.length > 0 ? (
                                templates.map((template) => {
                                    const managers = template.template_hiring_managers || [];
                                    const total = managers.length;

                                    // Calculate status dynamically based on global slots
                                    const provided = managers.filter((m: any) => availableManagerIds.has(m.hiring_manager_id)).length;
                                    const pending = total - provided;

                                    // Status Logic
                                    let statusColor = 'bg-gray-700 text-gray-300';
                                    if (total > 0 && provided === total) statusColor = 'bg-green-900 text-green-300';
                                    else if (pending < total) statusColor = 'bg-yellow-900 text-yellow-300';

                                    return (
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
                                                    {/* @ts-ignore */}
                                                    {template.template_hiring_managers?.slice(0, 3).map((thm: any, idx: number) => {
                                                        const isProvided = availableManagerIds.has(thm.hiring_manager_id);
                                                        // Priority: Provided (Green) > Requested (Yellow) > Default (Gray)
                                                        let colorClass = 'bg-gray-500';
                                                        if (isProvided) colorClass = 'bg-green-700';
                                                        else if (thm.availability_status === 'requested') colorClass = 'bg-yellow-700';

                                                        return (
                                                            <div key={idx}
                                                                title={`${thm.hiring_managers?.name} ${thm.hiring_managers?.role ? `(${thm.hiring_managers.role})` : ''} - ${isProvided ? 'Has Availability' : thm.availability_status}`}
                                                                className={`w-6 h-6 rounded-full border border-[#152211] flex items-center justify-center text-xs text-white ${colorClass}`}>
                                                                {thm.hiring_managers?.name?.[0] || 'U'}
                                                            </div>
                                                        );
                                                    })}

                                                    {/* @ts-ignore */}
                                                    {(template.template_hiring_managers?.length || 0) > 3 && (
                                                        <div className="w-6 h-6 rounded-full bg-gray-700 border border-[#152211] flex items-center justify-center text-[10px] text-white">
                                                            +{(template.template_hiring_managers?.length || 0) - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {total > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className={provided === total ? "text-green-400" : "text-white"}>{provided}/{total} Set</span>
                                                            {pending > 0 && <span className="text-red-400 text-[10px]">{pending} Pending</span>}
                                                        </div>
                                                        <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(provided / total) * 100}%` }}></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-500">No managers</span>
                                                )}
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
                                    )
                                })
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
