import { useTheme } from '@/shared/theme/ThemeProvider';

interface ThemeToggleProps {
    className?: string;
    ariaLabel?: string;
}

export function ThemeToggle({ ariaLabel = 'Toggle theme', className = '' }: ThemeToggleProps) {
    const { resolvedMode, toggle } = useTheme();
    const isDark = resolvedMode === 'dark';
    return (
        <button
            aria-label={ariaLabel}
            aria-pressed={isDark}
            className={`grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-brand-500 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-200 ${className}`}
            type="button"
            onClick={toggle}
        >
            {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
    );
}

function MoonIcon() {
    return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SunIcon() {
    return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
            <path
                d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                strokeLinecap="round"
            />
        </svg>
    );
}
