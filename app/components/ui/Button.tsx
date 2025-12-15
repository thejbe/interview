import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    children: ReactNode;
    fullWidth?: boolean;
}

export function Button({ variant = 'primary', children, fullWidth = false, className = '', ...props }: ButtonProps) {
    const baseStyles = "cursor-pointer font-bold py-3 px-4 rounded-full transition-colors flex items-center justify-center gap-2";

    const variants = {
        primary: "bg-primary hover:bg-primary/90 text-[#142210]",
        secondary: "bg-[#2c4823] hover:bg-[#2c4823]/80 text-white",
        outline: "bg-transparent border border-[#2c4823] text-white hover:border-primary hover:text-primary",
        ghost: "bg-transparent hover:bg-white/10 text-white",
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
