export function Header({ title, actions }: { title: React.ReactNode; actions?: React.ReactNode }) {
    return (
        <header className="flex items-center justify-between w-full py-[26px] px-8 border-b border-[#2c4823] bg-background-light dark:bg-background-dark sticky top-0 z-10 transition-all">
            <div className="flex items-center gap-4">
                {typeof title === 'string' ? (
                    <h2 className="text-black dark:text-white text-lg font-bold">{title}</h2>
                ) : (
                    title
                )}
            </div>
            <div className="flex items-center gap-4">
                {actions}
                <div className="h-6 w-px bg-[#2c4823] mx-2" />
                <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2c4823] text-white hover:bg-[#2c4823]/80 transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                </button>
            </div>
        </header>
    );
}
