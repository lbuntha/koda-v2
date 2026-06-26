import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
    Baby,
    BarChart3,
    LayoutDashboard,
    LogOut,
    Moon,
    Settings,
    Shuffle,
    Sun,
    Users,
    type LucideIcon,
} from 'lucide-react';
import type { UserPublic } from '@koda/contracts';
import { clearTokens, getMe, getStoredToken } from '@/lib/api';
import type { Locale } from '@/lib/i18n';
import { LocaleSwitcher } from '@/shared/ui';
import { useTheme } from '@/shared/theme/ThemeProvider';

type AuthState =
    | { status: 'loading' }
    | { status: 'unauthenticated' }
    | { status: 'authenticated'; token: string; user: UserPublic };

const NAV_ITEMS: Array<{ end?: boolean; icon: LucideIcon; label: string; to: string }> = [
    { end: true, icon: LayoutDashboard, label: 'Dashboard', to: '/parent' },
    { icon: Baby, label: 'My Kids', to: '/parent/onboarding' },
    { icon: Users, label: 'Children', to: '/parent/children' },
    { icon: BarChart3, label: 'Progress', to: '/parent/progress' },
    { icon: Settings, label: 'Settings', to: '/parent/settings' },
];

export default function ParentLayout() {
    const auth = useParentAuth();
    const location = useLocation();
    const [locale, setLocale] = useState<Locale>('en');

    if (auth.status === 'loading') {
        return <ParentLayoutSkeleton />;
    }

    if (auth.status === 'unauthenticated') {
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate replace to={`/login?next=${next}`} />;
    }

    if (auth.user.role !== 'parent') {
        return <Navigate replace to="/" />;
    }

    return (
        <div className="flex min-h-screen bg-[#FBFAFF] text-[#0E0B55] transition-colors duration-300 dark:bg-[#0B1120] dark:text-white">
            <ParentSidebar user={auth.user} />
            <main className="relative min-w-0 flex-1 p-3 sm:p-4 lg:p-5">
                <div className="absolute right-3 top-3 z-20 sm:right-4 sm:top-4 lg:right-5 lg:top-5">
                    <LocaleSwitcher label="" locale={locale} onChange={setLocale} />
                </div>
                <Outlet context={{ locale, token: auth.token, user: auth.user }} />
            </main>
        </div>
    );
}

export interface ParentOutletContext {
    locale: Locale;
    token: string;
    user: UserPublic;
}

function ParentSidebar({ user }: { user: UserPublic }) {
    const [collapsed, setCollapsed] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const { resolvedMode, toggle } = useTheme();
    const initials = getInitials(user.display_name || user.email);

    function signOut() {
        setProfileOpen(false);
        clearTokens();
        window.location.assign('/login');
    }

    return (
        <aside
            className={`flex h-screen w-[264px] shrink-0 flex-col border-r border-[#E7E2F6] bg-white shadow-sm transition-[width] duration-300 dark:border-slate-800 dark:bg-slate-900 ${
                collapsed ? 'md:w-[92px]' : 'md:w-[264px]'
            }`}
        >
            <div className={`flex items-center gap-3 p-5 pb-4 ${collapsed ? 'md:justify-center md:px-4' : ''}`}>
                <img
                    alt="Koda"
                    className={`h-10 w-10 rounded-2xl object-cover shadow-sm ${collapsed ? 'md:hidden' : ''}`}
                    src="/icons/icon-192.png"
                />
                <div className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}>
                    <p className="text-lg font-semibold text-[#0E0B55] dark:text-white">Koda</p>
                    <p className="text-xs font-semibold text-[#8D89AE]">Parent</p>
                </div>
                <button
                    className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#E7E2F6] bg-[#FBFAFF] text-[#6D6997] transition hover:border-[#D9D2F4] hover:bg-[#F5F1FF] hover:text-[#0E0B55] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 md:grid"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    type="button"
                    onClick={() => setCollapsed(value => !value)}
                >
                    <PanelIcon collapsed={collapsed} />
                </button>
            </div>

            <nav className="space-y-1 px-4">
                {NAV_ITEMS.map(item => (
                    <SidebarLink
                        key={item.to}
                        collapsed={collapsed}
                        end={item.end}
                        icon={item.icon}
                        label={item.label}
                        to={item.to}
                    />
                ))}
            </nav>

            <div className="relative mt-auto border-t border-[#F0ECFA] p-4 dark:border-slate-800">
                <button
                    className="flex w-full items-center gap-3 rounded-[1.35rem] bg-[#FBFAFF] p-3 text-left transition hover:bg-[#F5F1FF] dark:bg-slate-950 dark:hover:bg-slate-800"
                    type="button"
                    onClick={() => setProfileOpen(open => !open)}
                >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7C6DD8] to-[#534AB7] text-lg font-semibold text-white shadow-sm ring-1 ring-white/40 dark:ring-slate-800">
                        {initials}
                    </div>
                    <span className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}>
                        <span className="block truncate text-base font-semibold text-[#111827] dark:text-white">{user.display_name}</span>
                        <span className="block truncate text-sm font-medium text-[#77736F] dark:text-slate-400">
                            Family plan
                        </span>
                    </span>
                </button>
                {profileOpen && (
                    <div className={`absolute bottom-full mb-2 rounded-2xl border border-[#E7E2F6] bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900 ${collapsed ? 'left-4 w-56' : 'left-4 right-4'}`}>
                        <NavLink
                            to="/profiles"
                            className="koda-admin-nav-label flex min-h-10 items-center gap-2 rounded-xl px-3 text-[#6D6997] hover:bg-[#F8F5FF] hover:text-[#0E0B55] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            onClick={() => setProfileOpen(false)}
                        >
                            <Shuffle className="h-4 w-4" />
                            Switch profile
                        </NavLink>
                        <NavLink
                            to="/parent/settings"
                            className="koda-admin-nav-label flex min-h-10 items-center gap-2 rounded-xl px-3 text-[#6D6997] hover:bg-[#F8F5FF] hover:text-[#0E0B55] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            onClick={() => setProfileOpen(false)}
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </NavLink>
                        <button
                            className="koda-admin-nav-label flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-[#6D6997] hover:bg-[#F8F5FF] hover:text-[#0E0B55] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            type="button"
                            onClick={() => {
                                setProfileOpen(false);
                                toggle();
                            }}
                        >
                            <span className="inline-flex items-center gap-2">
                                {resolvedMode === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                                Theme
                            </span>
                            <span className="text-xs font-semibold">{resolvedMode === 'dark' ? 'Dark' : 'Light'}</span>
                        </button>
                        <button
                            className="koda-admin-nav-label flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                            type="button"
                            onClick={signOut}
                        >
                            <LogOut className="h-4 w-4" />
                            Log out
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

function SidebarLink({
    collapsed,
    end,
    icon: Icon,
    label,
    to,
}: {
    collapsed: boolean;
    end?: boolean;
    icon: LucideIcon;
    label: string;
    to: string;
}) {
    return (
        <NavLink
            end={end}
            title={collapsed ? label : undefined}
            to={to}
            className={({ isActive }) =>
                `koda-admin-nav-label flex min-h-11 items-center gap-3 rounded-2xl px-3 transition ${
                    collapsed ? 'md:justify-center md:px-0' : ''
                } ${
                    isActive
                        ? 'border border-[#D9D2F4] bg-[#F2EEFF] text-[#534AB7] shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                        : 'text-[#6D6997] hover:bg-[#F8F5FF] hover:text-[#0E0B55] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`
            }
        >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className={`truncate ${collapsed ? 'md:hidden' : ''}`}>{label}</span>
        </NavLink>
    );
}

function ParentLayoutSkeleton() {
    return (
        <div className="flex min-h-screen bg-[#FBFAFF]">
            <aside className="hidden w-[264px] shrink-0 border-r border-[#E7E2F6] bg-white p-5 md:block">
                <div className="h-10 w-28 rounded-2xl bg-[#F2EEFF]" />
                <div className="mt-8 space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="h-11 rounded-2xl bg-[#F7F4FF]" />
                    ))}
                </div>
            </aside>
            <main className="flex-1 p-5">
                <div className="h-28 rounded-3xl bg-white shadow-sm" />
            </main>
        </div>
    );
}

function useParentAuth(): AuthState {
    const [state, setState] = useState<AuthState>({ status: 'loading' });

    useEffect(() => {
        const token = getStoredToken();
        if (!token) {
            setState({ status: 'unauthenticated' });
            return;
        }
        getMe(token)
            .then(user => setState({ status: 'authenticated', token, user }))
            .catch(() => {
                clearTokens();
                setState({ status: 'unauthenticated' });
            });
    }, []);

    return state;
}

function getInitials(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'K';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function PanelIcon({ collapsed }: { collapsed: boolean }) {
    return (
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-13Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M9 4v16" stroke="currentColor" strokeWidth="1.8" />
            <path
                d={collapsed ? 'm14 9 3 3-3 3' : 'm17 9-3 3 3 3'}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
            />
        </svg>
    );
}
