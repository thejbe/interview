import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', id, ...props }, ref) => {
        const generatedId = useId();
        const inputId = id || generatedId;

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-[#9fc992] text-sm font-medium mb-2">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={`w-full bg-[#2c4823]/30 border border-[#2c4823] rounded-lg px-4 py-3 text-white placeholder-[#9fc992]/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
