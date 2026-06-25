import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { isAdminRole, useAdminAuth } from './hooks/useAdminAuth';
import type { Locale } from '@/lib/i18n';
import { copy } from '@/lib/i18n';
import { LocaleSwitcher, ThemeToggle } from '@/shared/ui';

export default function AdminLayout() {
    const auth = useAdminAuth();
    const location = useLocation();
    const [locale, setLocale] = useState<Locale>('en');
    const t = copy[locale];

    if (auth.status === 'loading') {
        return (
            <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-slate-500 dark:bg-[#0B1120] dark:text-slate-400">
                {t.loadingSettings}…
            </div>
        );
    }

    if (auth.status === 'unauthenticated') {
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?next=${next}`} replace />;
    }

    if (!isAdminRole(auth.user.role)) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#0B1120] dark:text-white md:flex-row">
            <AdminSidebar locale={locale} user={auth.user} />
            <main className="flex-1 px-5 py-6 sm:px-8 lg:px-10">
                <div className="mb-6 flex items-center justify-end gap-2">
                    <LocaleSwitcher locale={locale} onChange={setLocale} />
                    <ThemeToggle />
                </div>
                <Outlet context={{ locale, token: auth.token, user: auth.user }} />
            </main>
        </div>
    );
}

export interface AdminOutletContext {
    locale: Locale;
    token: string;
    user: import('@koda/contracts').UserPublic;
}
