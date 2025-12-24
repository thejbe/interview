"use client";
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/app/recruiter/actions';

interface SidebarRecruiterProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentClients?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allClients?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any;
}

export function SidebarRecruiter({ recentClients = [], allClients = [], user }: SidebarRecruiterProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const isActive = (path: string) => pathname?.startsWith(path);

    // Filter clients based on search
    const filteredClients = searchQuery
        ? allClients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    const handleSelectClient = (id: string) => {
        router.push(`/recruiter/clients/${id}/dashboard`);
        setSearchQuery('');
    };

    const avatarUrl = user?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCmoIGdqE80auShoJkDGChmIB4DrOf1IQ0vaFKYOX7AGKphgefGV5o-2LwMCjrItNsnJy1wKzzfgGD25f1CHnl5CeVQD9OaHcHkMMypsWJDefUG1ErFL2v3V-HDDv_ZmoIUKruZ7dxlLP2nX4b4ZcVm7pC-oPjWUWlplrpfj40cSyERHXfWwdpVz8ymc-akLciztsma1YcpvdyorMNWtwe_8_X0dJyVXygwPfSlllbDL_JcsPabxqKBUUESoRfj4-MU1VZ19vPLjGW';

    return (
        <aside className="flex flex-col w-64 bg-[#142210] p-4 font-display flex-shrink-0 border-r border-[#2c4823] h-screen sticky top-0 overflow-hidden">
            <Link href="/recruiter" className="flex items-center gap-3 p-2 mb-6 hover:opacity-80 transition-opacity">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAtk02XUI2TjvCyvZJ55eiIaXagtiaUdmPVL8golyshCvOwCS99zCFsivZkCk1miLFdxIBEDjdqqALhfD7lEytt89hub5hDQ0XOjW3HYsW3KyI6mKR-tyW1VrVBDVeUmOX6a7HJOtyTGmHVfRqQi3lkOgwA612Kx7XV0BSqDr2v0Jar6NpELhRJ_GZywhEDHE822GsWriy4l4vNwCLPbA0uBek_pXak-Z4D1lBUtbO9q_SWEWgtOp7n4BZGzNhgpGFtkB8Tly_E6nt1")' }}>
                </div>
                <h1 className="text-white text-lg font-bold leading-normal">Stitch</h1>
            </Link>

            <div className="flex flex-col gap-4 mb-auto min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                {/* Search */}
                <div className="px-3 py-2 relative">
                    <label className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-white/40 text-lg">search</span>
                        <input
                            className="w-full h-9 pl-10 pr-4 text-sm rounded-full bg-white/5 placeholder:text-white/40 text-white border border-[#2c4823] focus:ring-primary focus:border-primary focus:outline-none transition-all"
                            placeholder="Find client..."
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </label>
                </div>

                {/* Navigation / Client List */}
                <nav className="flex flex-col gap-1">
                    {searchQuery ? (
                        <div className="space-y-1">
                            {filteredClients.length === 0 ? (
                                <p className="text-white/40 text-sm px-4 py-2">No clients found.</p>
                            ) : (
                                filteredClients.map(client => (
                                    <button
                                        key={client.id}
                                        onClick={() => handleSelectClient(client.id)}
                                        className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                                            {client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <p className="text-white text-sm truncate">{client.name}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Recent Clients Section */}
                            {recentClients.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="px-4 text-[10px] uppercase font-bold text-[#9fc992] tracking-wider mb-2">Recent Clients</h3>
                                    <div className="space-y-0.5">
                                        {recentClients.map(client => (
                                            <Link
                                                key={client.id}
                                                href={`/recruiter/clients/${client.id}/dashboard`}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${isActive(`/recruiter/clients/${client.id}`) ? 'bg-[#2c4823]/50 text-white' : 'hover:bg-white/5 text-gray-300'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive(`/recruiter/clients/${client.id}`) ? 'bg-primary text-[#142210]' : 'bg-[#2c4823] text-white group-hover:bg-[#2c4823]/80'}`}>
                                                    {client.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <p className="text-sm truncate">{client.name}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <h3 className="px-4 text-[10px] uppercase font-bold text-[#9fc992] tracking-wider mb-2 mt-2">Menu</h3>

                            <Link
                                href="/recruiter/clients"
                                className={`flex items-center gap-3 px-3 py-2 rounded-full transition-colors duration-200 nav-link ${isActive('/recruiter/clients') && !pathname?.includes('/dashboard') ? 'bg-primary/20 text-white' : 'hover:bg-white/10 text-gray-300'}`}
                            >
                                <span className="material-symbols-outlined text-xl">domain</span>
                                <p className="text-sm font-medium">All Clients</p>
                            </Link>

                            <Link
                                href="/recruiter/templates"
                                className={`flex items-center gap-3 px-3 py-2 rounded-full transition-colors duration-200 nav-link ${isActive('/recruiter/templates') ? 'bg-primary text-[#142210]' : 'hover:bg-white/10 text-gray-300'}`}
                            >
                                <span className={`material-symbols-outlined text-xl ${isActive('/recruiter/templates') ? 'text-[#142210]' : ''}`}>draft</span>
                                <p className="text-sm font-medium">Templates</p>
                            </Link>

                            <Link
                                href="/recruiter/bookings"
                                className={`flex items-center gap-3 px-3 py-2 rounded-full transition-colors duration-200 nav-link ${isActive('/recruiter/bookings') ? 'bg-primary text-[#142210]' : 'hover:bg-white/10 text-gray-300'}`}
                            >
                                <span className={`material-symbols-outlined text-xl ${isActive('/recruiter/bookings') ? 'text-[#142210]' : ''}`}>calendar_add_on</span>
                                <p className="text-sm font-medium">Bookings</p>
                            </Link>

                            <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-white/10 transition-colors duration-200 nav-link text-gray-300">
                                <span className="material-symbols-outlined text-xl">settings</span>
                                <p className="text-sm font-medium">Settings</p>
                            </Link>
                        </>
                    )}
                </nav>
            </div>

            <div className="mt-auto border-t border-[#2c4823] p-2" ref={userMenuRef}>
                <div className="relative">
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-3 p-2 w-full rounded-lg hover:bg-white/10 transition-colors text-left"
                    >
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 shrink-0"
                            style={{ backgroundImage: `url("${avatarUrl}")` }}>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <h3 className="text-white text-sm font-medium leading-tight truncate">{user?.name || 'Recruiter'}</h3>
                            <p className="text-gray-400 text-xs font-normal leading-tight truncate">{user?.role === 'admin' ? 'Admin' : 'Recruiter'}</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 ml-auto text-lg">
                            {isUserMenuOpen ? 'expand_less' : 'expand_more'}
                        </span>
                    </button>

                    {isUserMenuOpen && (
                        <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1C1C1C] border border-[#2c4823] rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                            <div className="p-1">
                                {user?.role === 'admin' && (
                                    <Link
                                        href="/recruiter/settings/team"
                                        onClick={() => setIsUserMenuOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">group</span>
                                        Team Settings
                                    </Link>
                                )}
                                <Link
                                    href="/recruiter/profile"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">person</span>
                                    Profile
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#ff6b6b] hover:bg-[#ff6b6b]/10 rounded-lg transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    Log out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
