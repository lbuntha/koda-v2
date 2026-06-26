import { Link } from 'react-router-dom';
import { ReactNode } from 'react';
import { copy, type Locale } from '@/lib/i18n';
import { LocaleSwitcher } from './LocaleSwitcher';

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
        <header className="sticky top-0 z-30 border-b border-[#ECE8F7] bg-white/90 backdrop-blur-md transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-900/80">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
                <Link className="flex items-center gap-3" to={titleTo}>
                    <img alt="Koda" className="h-10 w-10 rounded-2xl object-cover shadow-sm" height={40} src="/icons/icon-192.png" width={40} />
                    <div className="leading-tight">
                        <p className="text-base font-semibold text-[#0E0B55] dark:text-white sm:text-lg">
                            {t.appName}
                        </p>
                        {kicker && (
                            <p className="text-xs font-medium text-[#6D6997] dark:text-slate-400">{kicker}</p>
                        )}
                    </div>
                </Link>
                <div className="flex items-center gap-2">
                    {actions}
                    <LocaleSwitcher label="" locale={locale} onChange={onLocaleChange} />
                </div>
            </div>
        </header>
    );
}
