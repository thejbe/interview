export function Header({ title }: { title: string }) {
    return (
        <header className="flex items-center justify-between w-full p-4 border-b border-[#2c4823] bg-background-light dark:bg-background-dark sticky top-0 z-10 transition-all">
            <div className="flex items-center gap-4">
                <h2 className="text-black dark:text-white text-lg font-bold">{title}</h2>
            </div>
            <div className="flex-1 max-w-md px-8">
                <label className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-4 text-white/40">search</span>
                    <input
                        className="w-full h-10 px-12 text-sm rounded-full bg-white/5 placeholder:text-white/40 text-white border border-[#2c4823] focus:ring-primary focus:border-primary"
                        placeholder="Search..." type="search" />
                </label>
            </div>
            <div className="flex items-center gap-4">
                <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2c4823] text-white hover:bg-[#2c4823]/80 transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                </button>
            </div>
        </header>
    );
}
