export function Header({ title }: { title: string }) {
    return (
        <header className="flex items-center justify-between w-full p-4 border-b border-[#2c4823] bg-background-light dark:bg-background-dark sticky top-0 z-10 transition-all">
            <div className="flex items-center gap-4">
                <h2 className="text-black dark:text-white text-lg font-bold">{title}</h2>
            </div>
            <div className="flex items-center gap-4">
                <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2c4823] text-white hover:bg-[#2c4823]/80 transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                </button>
            </div>
        </header>
    );
}
