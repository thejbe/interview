import { SidebarRecruiter } from './SidebarRecruiter';
import { SidebarManager } from './SidebarManager';

interface AppShellProps {
    children: React.ReactNode;
    role: 'recruiter' | 'manager';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentClients?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allClients?: any[];
}

export function AppShell({ children, role, recentClients, allClients }: AppShellProps) {
    return (
        <div className="flex bg-background-light dark:bg-background-dark min-h-screen">
            {role === 'recruiter' ? <SidebarRecruiter recentClients={recentClients} allClients={allClients} /> : <SidebarManager />}

            <div className="flex flex-1 flex-col transition-all w-full min-w-0">
                {children}

                {/* Footer can remain here or move to pages. Let's keep it here for now, but wrapped in padding? 
                    If children defines Main, footer is outside Main? 
                    Ideally footer is inside the scrollable area.
                    If AppShell doesn't control scrolling, who does?
                    Sidebar is sticky. Main content should scroll.
                    So `div.flex-1` should be the scroll container? or the window scrolls?
                    Previously `AppShell` had `min-h-screen`.
                    If `children` contains Header (sticky) and Main (scroll), then `div.flex-1` is just a container.
                    Let's assume window scroll for now.
                */}
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
            </div>
        </div>
    );
}
