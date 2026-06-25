import { Link } from 'react-router-dom';
import { ReactNode } from 'react';
import { copy, type Locale } from '@/lib/i18n';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ThemeToggle } from './ThemeToggle';

interface AppHeaderProps {
    locale: Locale;
    onLocaleChange: (locale: Locale) => void;
    kicker?: string;
    titleTo?: string;
    actions?: ReactNode;
}

export function AppHeader({ actions, kicker, locale, onLocaleChange, titleTo = '/' }: AppHeaderProps) {
    const t = copy[locale];
    return (
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-md transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-900/70">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
                <Link className="flex items-center gap-3" to={titleTo}>
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-koda-gradient text-base font-black text-white shadow-koda-glow">
                        K
                    </div>
                    <div className="leading-tight">
                        <p className="text-base font-black tracking-tight text-slate-900 dark:text-white sm:text-lg">
                            {t.appName}
                        </p>
                        {kicker && (
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{kicker}</p>
                        )}
                    </div>
                </Link>
                <div className="flex items-center gap-2">
                    {actions}
                    <LocaleSwitcher locale={locale} onChange={onLocaleChange} />
                    <ThemeToggle ariaLabel="Toggle theme" />
                </div>
            </div>
        </header>
    );
}
