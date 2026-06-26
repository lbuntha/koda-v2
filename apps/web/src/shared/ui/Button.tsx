import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';

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
    'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 ' +
    'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BDB4F4] focus-visible:ring-offset-2 ' +
    'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900';

const SIZES: Record<Size, string> = {
    sm: 'h-9 px-3 text-xs',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-10 w-10',
};

const VARIANTS: Record<Variant, string> = {
    primary:
        'bg-[#534AB7] text-white shadow-sm hover:bg-[#453DA0] ' +
        'dark:bg-brand-400 dark:text-slate-950 dark:hover:bg-brand-200',
    secondary:
        'bg-[#F2EEFF] text-[#534AB7] hover:bg-[#E8E2FF] ' +
        'dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    outline:
        'border border-[#DCD7EA] bg-white text-[#534AB7] shadow-sm hover:border-[#BDB4F4] hover:bg-[#FBFAFF] hover:text-[#453DA0] ' +
        'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-400 dark:hover:text-brand-200',
    ghost:
        'text-[#6D6997] hover:bg-[#F4F1FF] hover:text-[#0E0B55] ' +
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
    return <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" strokeWidth={2.4} />;
}
