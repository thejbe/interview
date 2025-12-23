import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/app/components/layout/Header';

export default async function ClientsPage() {
    const supabase = await createClient();

    // Fetch companies with departments and hiring managers
    const { data: companies } = await supabase
        .from('companies')
        .select(`
            *,
            departments ( name ),
            hiring_managers ( name, role )
        `)
        .order('created_at', { ascending: false });

    return (
        <div className="flex flex-col h-screen">
            <Header
                title="Clients"
                actions={
                    <Link href="/recruiter/clients/new"
                        className="flex items-center justify-center px-4 py-2 bg-primary text-[#142210] font-bold rounded-full hover:bg-primary/90 transition-colors text-sm">
                        <span className="material-symbols-outlined mr-1 text-lg">add</span>
                        Add Client
                    </Link>
                }
            />

            <main className="flex-1 p-8 overflow-y-auto">
                {/* Table */}
                <div className="bg-[#152211] border border-[#2c4823] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-[#9fc992] uppercase bg-[#2c4823]/20">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Client Name</th>
                                    <th scope="col" className="px-6 py-3">Departments</th>
                                    <th scope="col" className="px-6 py-3">Contacts</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {companies && companies.length > 0 ? (
                                    companies.map((company) => (
                                        <tr key={company.id} className="border-b border-[#2c4823] hover:bg-[#2c4823]/10">
                                            <td className="px-6 py-4 font-medium text-white">{company.name}</td>
                                            <td className="px-6 py-4">
                                                {/* @ts-ignore */}
                                                {company.departments?.map((d: any) => d.name).join(', ') || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {/* @ts-ignore */}
                                                {company.hiring_managers?.map((hm: any) => hm.name + (hm.role ? ` (${hm.role})` : '')).join(', ') || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${company.active !== false ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                                    {company.active !== false ? 'Active' : 'Archived'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/recruiter/clients/${company.id}/dashboard`} className="text-primary hover:underline mr-3">
                                                    Dashboard
                                                </Link>
                                                <Link href={`/recruiter/clients/${company.id}`} className="text-gray-400 hover:text-white">
                                                    Settings
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-[#9fc992]">
                                            No clients found. Add one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
