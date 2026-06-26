import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    hint?: string;
    error?: string | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { className = '', error, hint, id, label, ...rest },
    ref,
) {
    const reactId = useId();
    const inputId = id ?? reactId;
    const required = Boolean(rest.required);
    return (
        <label className="block" htmlFor={inputId}>
            {label && (
                <span className="text-xs font-semibold uppercase text-[#6D6997] dark:text-slate-400">
                    {label}
                    {required && <span className="ml-1 text-rose-500">*</span>}
                </span>
            )}
            <input
                ref={ref}
                id={inputId}
                className={`mt-1 min-h-10 w-full rounded-xl border bg-white px-3 text-sm font-medium text-[#0E0B55] outline-none transition placeholder:text-[#A7A2B8] focus:border-[#534AB7] focus:ring-4 focus:ring-[#E8E3FF] disabled:cursor-not-allowed disabled:bg-slate-50 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-400 dark:focus:ring-slate-800 dark:disabled:bg-slate-950 ${
                    error
                        ? 'border-rose-300 dark:border-rose-500/60'
                        : 'border-[#DCD7EA] dark:border-slate-700'
                } ${className}`}
                {...rest}
            />
            {hint && !error && (
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
            )}
            {error && (
                <span className="mt-1 block text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</span>
            )}
        </label>
    );
});
