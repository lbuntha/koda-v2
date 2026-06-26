import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminLayoutSkeleton } from './components/AdminSkeleton';
import { isAdminRole, useAdminAuth } from './hooks/useAdminAuth';
import type { Locale } from '@/lib/i18n';
import { LocaleSwitcher } from '@/shared/ui';

export default function AdminLayout() {
    const auth = useAdminAuth();
    const location = useLocation();
    const [locale, setLocale] = useState<Locale>('en');

    if (auth.status === 'loading') {
        return <AdminLayoutSkeleton />;
    }

    if (auth.status === 'unauthenticated') {
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?next=${next}`} replace />;
    }

    if (!isAdminRole(auth.user.role)) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen bg-[#FBFAFF] text-[#0E0B55] transition-colors duration-300 dark:bg-[#0B1120] dark:text-white">
            <AdminSidebar locale={locale} user={auth.user} />
            <main className="relative min-w-0 flex-1 p-3 sm:p-4 lg:p-5">
                <div className="absolute right-3 top-3 z-20 sm:right-4 sm:top-4 lg:right-5 lg:top-5">
                    <LocaleSwitcher label="" locale={locale} onChange={setLocale} />
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
