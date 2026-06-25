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
    return (
        <label className="block" htmlFor={inputId}>
            {label && (
                <span className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {label}
                </span>
            )}
            <input
                ref={ref}
                id={inputId}
                className={`mt-1 min-h-12 w-full rounded-2xl border bg-white px-4 text-base font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-950 ${
                    error
                        ? 'border-rose-300 dark:border-rose-500/60'
                        : 'border-slate-200 dark:border-slate-700'
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
