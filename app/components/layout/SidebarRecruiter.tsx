"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SidebarRecruiter() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname?.startsWith(path);

    return (
        <aside className="flex flex-col w-64 bg-[#142210] p-4 font-display flex-shrink-0 border-r border-[#2c4823] h-screen sticky top-0">
            <Link href="/recruiter/dashboard" className="flex items-center gap-3 p-2 mb-6 hover:opacity-80 transition-opacity">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAtk02XUI2TjvCyvZJ55eiIaXagtiaUdmPVL8golyshCvOwCS99zCFsivZkCk1miLFdxIBEDjdqqALhfD7lEytt89hub5hDQ0XOjW3HYsW3KyI6mKR-tyW1VrVBDVeUmOX6a7HJOtyTGmHVfRqQi3lkOgwA612Kx7XV0BSqDr2v0Jar6NpELhRJ_GZywhEDHE822GsWriy4l4vNwCLPbA0uBek_pXak-Z4D1lBUtbO9q_SWEWgtOp7n4BZGzNhgpGFtkB8Tly_E6nt1")' }}>
                </div>
                <h1 className="text-white text-lg font-bold leading-normal">Stitch</h1>
            </Link>
            <div className="flex flex-col gap-4 mb-auto">
                <div className="px-3 py-2">
                    <label className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-white/40 text-lg">search</span>
                        <input
                            className="w-full h-9 pl-10 pr-4 text-sm rounded-full bg-white/5 placeholder:text-white/40 text-white border border-[#2c4823] focus:ring-primary focus:border-primary"
                            placeholder="Search..." type="search" />
                    </label>
                </div>
                <nav className="flex flex-col gap-2">
                    {/* Clients */}
                    <Link
                        href="/recruiter/clients"
                        className={`flex items-center gap-3 px-3 py-2 rounded-full transition-colors duration-200 nav-link ${isActive('/recruiter/clients') ? 'bg-primary' : 'hover:bg-white/10'}`}
                    >
                        <span className={`material-symbols-outlined text-2xl ${isActive('/recruiter/clients') ? 'text-background-dark' : 'text-white font-light'}`}>
                            domain
                        </span>
                        <p className={`text-sm font-bold leading-normal ${isActive('/recruiter/clients') ? 'text-background-dark' : 'text-white'}`}>Clients</p>
                    </Link>

                    {/* Templates */}
                    <Link
                        href="/recruiter/templates"
                        className={`flex items-center gap-3 px-3 py-2 rounded-full transition-colors duration-200 nav-link ${isActive('/recruiter/templates') ? 'bg-primary' : 'hover:bg-white/10'}`}
                    >
                        <span className={`material-symbols-outlined text-2xl ${isActive('/recruiter/templates') ? 'text-background-dark' : 'text-white font-light'}`}>
                            draft
                        </span>
                        <p className={`text-sm font-bold leading-normal ${isActive('/recruiter/templates') ? 'text-background-dark' : 'text-white'}`}>Templates</p>
                    </Link>

                    {/* Bookings */}
                    <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-white/10 transition-colors duration-200 nav-link">
                        <span className="material-symbols-outlined text-white text-2xl font-light">calendar_add_on</span>
                        <p className="text-white text-sm font-medium leading-normal">Bookings</p>
                    </Link>

                    {/* Settings */}
                    <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-white/10 transition-colors duration-200 nav-link">
                        <span className="material-symbols-outlined text-white text-2xl font-light">settings</span>
                        <p className="text-white text-sm font-medium leading-normal">Settings</p>
                    </Link>
                </nav>
            </div>
            <div className="mt-auto">
                <div className="flex items-center gap-3 p-2">
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                        style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCCmoIGdqE80auShoJkDGChmIB4DrOf1IQ0vaFKYOX7AGKphgefGV5o-2LwMCjrItNsnJy1wKzzfgGD25f1CHnl5CeVQD9OaHcHkMMypsWJDefUG1ErFL2v3V-HDDv_ZmoIUKruZ7dxlLP2nX4b4ZcVm7pC-oPjWUWlplrpfj40cSyERHXfWwdpVz8ymc-akLciztsma1YcpvdyorMNWtwe_8_X0dJyVXygwPfSlllbDL_JcsPabxqKBUUESoRfj4-MU1VZ19vPLjGW")' }}>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-white text-base font-medium leading-tight">Alex Chen</h3>
                        <p className="text-gray-400 text-sm font-normal leading-tight">Recruiter</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
