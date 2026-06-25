import { NavLink } from 'react-router-dom';
import type { UserPublic } from '@koda/contracts';
import { copy, type Locale } from '@/lib/i18n';

interface NavItem {
    to: string;
    labelKey: keyof (typeof copy)['en'];
    end?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
    { to: '/admin', labelKey: 'navOverview', end: true },
    { to: '/admin/roles', labelKey: 'navRoles' },
    { to: '/admin/features', labelKey: 'navFeatures' },
    { to: '/admin/settings', labelKey: 'navSettings' },
];

const SECONDARY_NAV: NavItem[] = [
    { to: '/admin/skills', labelKey: 'navSkills' },
    { to: '/admin/users', labelKey: 'navUsers' },
    { to: '/admin/audit', labelKey: 'navAudit' },
];

export function AdminSidebar({ locale, user }: { locale: Locale; user: UserPublic }) {
    const t = copy[locale];
    return (
        <aside className="flex w-full flex-col gap-6 border-b border-slate-200 bg-white p-5 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 md:h-screen md:w-64 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-koda-gradient text-base font-black text-white shadow-koda-glow">
                    K
                </div>
                <div className="leading-tight">
                    <p className="text-xs font-black uppercase tracking-wide text-brand-600 dark:text-brand-400">
                        {t.adminConsole}
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{user.display_name}</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{user.role}</p>
                </div>
            </div>

            <nav className="space-y-1">
                {PRIMARY_NAV.map(item => (
                    <NavLink
                        key={item.to}
                        end={item.end}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex min-h-11 items-center rounded-2xl px-4 text-sm font-bold transition ${
                                isActive
                                    ? 'bg-brand-500 text-white shadow-sm dark:bg-brand-400 dark:text-slate-950'
                                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`
                        }
                    >
                        {t[item.labelKey]}
                    </NavLink>
                ))}
            </nav>

            <div className="space-y-1">
                <p className="px-4 text-xs font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {t.comingSoon}
                </p>
                {SECONDARY_NAV.map(item => (
                    <span
                        key={item.to}
                        className="flex min-h-11 cursor-not-allowed items-center rounded-2xl px-4 text-sm font-bold text-slate-400 dark:text-slate-600"
                    >
                        {t[item.labelKey]}
                    </span>
                ))}
            </div>

            <div className="mt-auto">
                <NavLink
                    to="/"
                    className="flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {t.backToApp}
                </NavLink>
            </div>
        </aside>
    );
}
