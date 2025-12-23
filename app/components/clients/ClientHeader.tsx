import Link from 'next/link';

interface ClientHeaderProps {
    client: {
        id: string;
        name: string;
        active: boolean;
        industry?: string;
        website?: string;
    };
}

export function ClientHeader({ client }: ClientHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                        <span className="material-symbols-outlined text-primary">business</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{client.name}</h1>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${client.active ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>
                        {client.active ? 'Active' : 'Archived'}
                    </span>
                </div>
                <div className="flex gap-4 text-sm text-[#9fc992] ml-13 pl-1">
                    {client.industry && <span>{client.industry}</span>}
                    {client.website && (
                        <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline flex items-center gap-1">
                            {client.website.replace(/^https?:\/\//, '')}
                            <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                        </a>
                    )}
                </div>
            </div>

            <div className="flex gap-3">
                <Link
                    href={`/recruiter/clients/${client.id}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2c4823] bg-[#152211] text-[#9fc992] hover:text-white hover:border-primary/50 transition-all font-medium text-sm"
                >
                    <span className="material-symbols-outlined text-lg">settings</span>
                    Settings
                </Link>
            </div>
        </div>
    );
}
