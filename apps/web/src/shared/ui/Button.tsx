import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'amber';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    loadingText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

const BASE =
    'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition-all duration-200 ' +
    'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ' +
    'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900';

const SIZES: Record<Size, string> = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10',
};

const VARIANTS: Record<Variant, string> = {
    primary:
        'bg-brand-500 text-white shadow-koda-glow hover:bg-brand-600 ' +
        'dark:bg-brand-400 dark:text-slate-950 dark:hover:bg-brand-200',
    secondary:
        'bg-koda-purple-soft text-brand-700 hover:bg-brand-100 ' +
        'dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    outline:
        'border border-slate-200 bg-white text-slate-700 hover:border-brand-500 hover:text-brand-700 ' +
        'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-200',
    ghost:
        'text-slate-600 hover:bg-slate-100 hover:text-slate-900 ' +
        'dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
    destructive:
        'bg-rose-500 text-white hover:bg-rose-600 shadow-sm ' +
        'dark:bg-rose-500 dark:hover:bg-rose-400',
    amber:
        'bg-koda-amber text-white shadow-koda-amber-glow hover:bg-koda-amber-hover ' +
        'dark:bg-koda-amber dark:text-slate-950',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        children,
        className = '',
        disabled,
        leftIcon,
        loading = false,
        loadingText,
        rightIcon,
        size = 'md',
        variant = 'primary',
        type = 'button',
        ...rest
    },
    ref,
) {
    return (
        <button
            ref={ref}
            aria-busy={loading || undefined}
            className={`${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
            disabled={disabled || loading}
            type={type}
            {...rest}
        >
            {loading ? <Spinner /> : leftIcon}
            <span>{loading && loadingText ? loadingText : children}</span>
            {!loading && rightIcon}
        </button>
    );
});

function Spinner() {
    return (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
                className="opacity-75"
                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                fill="currentColor"
            />
        </svg>
    );
}
