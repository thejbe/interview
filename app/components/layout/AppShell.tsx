import { SidebarRecruiter } from './SidebarRecruiter';
import { SidebarManager } from './SidebarManager';
import { Header } from './Header';

interface AppShellProps {
    children: React.ReactNode;
    role: 'recruiter' | 'manager';
    title?: string;
}

export function AppShell({ children, role, title = 'Dashboard' }: AppShellProps) {
    return (
        <div className="flex bg-background-light dark:bg-background-dark min-h-screen">
            {role === 'recruiter' ? <SidebarRecruiter /> : <SidebarManager />}

            <div className="flex flex-1 flex-col transition-all w-full">
                <Header title={title} />
                <main className="flex-1 p-8">
                    {children}

                    <footer className="app-footer flex-shrink-0 px-10 pb-6 mt-auto">
                        <div className="border-t border-[#2c4823] pt-6">
                            <div className="flex flex-wrap items-center justify-between gap-6 text-sm">
                                <p className="text-[#9fc992] font-normal leading-normal">© 2023 Stitch by Google. All rights reserved.</p>
                                <div className="flex flex-wrap items-center justify-center gap-6">
                                    <a className="text-[#9fc992] font-normal leading-normal hover:text-primary" href="#">Help</a>
                                    <a className="text-[#9fc992] font-normal leading-normal hover:text-primary" href="#">Terms of Service</a>
                                    <a className="text-[#9fc992] font-normal leading-normal hover:text-primary" href="#">Privacy Policy</a>
                                </div>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
}
