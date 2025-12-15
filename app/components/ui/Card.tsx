import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
    return (
        <div
            className={`bg-[#152211] border border-[#2c4823] rounded-2xl p-6 shadow-sm ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
