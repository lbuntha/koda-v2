import { NavLink } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
    Activity,
    Baby,
    BarChart3,
    BookOpen,
    GraduationCap,
    LayoutDashboard,
    Menu as MenuIcon,
    School,
    ScrollText,
    Settings,
    ShieldCheck,
    ToggleLeft,
    TrendingUp,
    Trophy,
    Users,
    type LucideIcon,
} from 'lucide-react';
import type { MenuItem, MenuSection, MenusSettings, Role, RolesSettings, UserPublic } from '@koda/contracts';
import { copy, type Locale } from '@/lib/i18n';
import { clearTokens, getMenuSettings, getRoleSettings, getStoredToken } from '@/lib/api';
import { useTheme } from '@/shared/theme/ThemeProvider';

const ICONS: Record<string, LucideIcon> = {
    LayoutDashboard,
    ShieldCheck,
    ToggleLeft,
    Settings,
    Activity,
    Menu: MenuIcon,
    BookOpen,
    Users,
    ScrollText,
    GraduationCap,
    BarChart3,
    School,
    Baby,
    TrendingUp,
    Trophy,
};

interface NavSection {
    section: MenuSection;
    items: MenuItem[];
}

export function AdminSidebar({ locale, user }: { locale: Locale; user: UserPublic }) {
    const t = copy[locale];
    const [profileOpen, setProfileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const initials = getInitials(user.display_name || user.email);
    const [roles, setRoles] = useState<RolesSettings | null>(null);
    const [menus, setMenus] = useState<MenusSettings | null>(null);
    const { resolvedMode, toggle } = useTheme();

    useEffect(() => {
        const token = getStoredToken();
        if (!token) return;
        Promise.all([getRoleSettings(token), getMenuSettings(token)])
            .then(([r, m]) => {
                setRoles(r);
                setMenus(m);
            })
            .catch(() => {
                setRoles({ permissions: [], roles: [] });
                setMenus({ items: [] });
            });
    }, [user.role]);

    const sections = useMemo<NavSection[]>(() => {
        if (!roles || !menus) return [];
        const roleConfig = roles.roles.find(r => r.role === user.role);
        const allowedIds = new Set(roleConfig?.menu_items ?? []);
        const userPerms = new Set(roleConfig?.permissions ?? []);
        const grantsAll = user.role === 'admin';
        const visible = menus.items
            .filter(item => item.enabled)
            .filter(item => grantsAll || allowedIds.has(item.id))
            .filter(item => item.scope === 'all' || item.scope === user.role)
            .filter(item => !item.permission || userPerms.has(item.permission))
            .sort((a, b) => a.order - b.order);
        const bySection = new Map<MenuSection, MenuItem[]>();
        for (const item of visible) {
            const list = bySection.get(item.section) ?? [];
            list.push(item);
            bySection.set(item.section, list);
        }
        const out: NavSection[] = [];
        if (bySection.has('top')) out.push({ section: 'top', items: bySection.get('top')! });
        if (bySection.has('manage')) out.push({ section: 'manage', items: bySection.get('manage')! });
        return out;
    }, [roles, menus, user.role]);

    function signOut() {
        setProfileOpen(false);
        clearTokens();
        window.location.assign('/login');
    }

    return (
        <aside
            className={`flex h-screen w-[264px] shrink-0 flex-col border-r border-[#E7E2F6] bg-white shadow-sm transition-[width,background-color,border-color] duration-300 dark:border-slate-800 dark:bg-slate-900 ${
                collapsed ? 'md:w-[92px]' : 'md:w-[264px]'
            }`}
        >
            <div className={`flex items-center gap-3 p-5 pb-4 ${collapsed ? 'md:justify-center md:px-4' : ''}`}>
                <img
                    alt="Koda"
                    className={`h-10 w-10 rounded-2xl object-cover shadow-sm ${collapsed ? 'md:hidden' : ''}`}
                    height={40}
                    src="/icons/icon-192.png"
                    width={40}
                />
                <div className={`flex-1 ${collapsed ? 'md:hidden' : ''}`}>
                    <p className="text-lg font-semibold text-[#0E0B55] dark:text-white">Koda</p>
                </div>
                <button
                    className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#E7E2F6] bg-[#FBFAFF] text-[#6D6997] transition hover:border-[#D9D2F4] hover:bg-[#F5F1FF] hover:text-[#0E0B55] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 md:grid"
                    title={collapsed ? t.expandSidebar : t.collapseSidebar}
                    type="button"
                    onClick={() => setCollapsed(value => !value)}
                >
                    <PanelIcon collapsed={collapsed} />
                </button>
            </div>

            <div className="space-y-6 px-4">
                {sections.map(section => (
                    <nav key={section.section} className="space-y-1">
                        {section.section === 'manage' && (
                            <p className={`koda-admin-chip px-4 uppercase text-[#8D89AE] ${collapsed ? 'md:hidden' : ''}`}>
                                {t.manage}
                            </p>
                        )}
                        {section.items.map(item => (
                            <SidebarLink
                                key={item.id}
                                collapsed={collapsed}
                                end={item.end}
                                icon={ICONS[item.icon] ?? LayoutDashboard}
                                label={(t as Record<string, string>)[item.label_key] ?? item.label_key}
                                to={item.route}
                            />
                        ))}
                    </nav>
                ))}
            </div>

            <div className="relative mt-auto border-t border-[#F0ECFA] p-4 dark:border-slate-800">
                <button
                    className="flex w-full items-center gap-3 rounded-[1.35rem] bg-[#FBFAFF] p-3 text-left transition hover:bg-[#F5F1FF] dark:bg-slate-950 dark:hover:bg-slate-800"
                    title={t.profileMenu}
                    type="button"
                    onClick={() => setProfileOpen(open => !open)}
                >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7C6DD8] to-[#534AB7] text-lg font-semibold text-white shadow-sm ring-1 ring-white/40 dark:ring-slate-800">
                        {initials}
                    </div>
                    <span className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}>
                        <span className="block truncate text-base font-semibold text-[#111827] dark:text-white">{user.display_name}</span>
                        <span className="block truncate text-sm font-medium text-[#77736F] dark:text-slate-400">
                            {getRolePlan(user.role, t)}
                        </span>
                    </span>
                </button>
                {profileOpen && (
                    <div className={`absolute bottom-full mb-2 rounded-2xl border border-[#E7E2F6] bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900 ${collapsed ? 'left-4 w-56' : 'left-4 right-4'}`}>
                        <NavLink
                            to="/"
                            className="koda-admin-nav-label flex min-h-10 items-center rounded-xl px-3 text-[#6D6997] hover:bg-[#F8F5FF] hover:text-[#0E0B55] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            onClick={() => setProfileOpen(false)}
                        >
                            {t.backToApp}
                        </NavLink>
                        <NavLink
                            to={getSettingsPath(user.role)}
                            className="koda-admin-nav-label flex min-h-10 items-center rounded-xl px-3 text-[#6D6997] hover:bg-[#F8F5FF] hover:text-[#0E0B55] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            onClick={() => setProfileOpen(false)}
                        >
                            {t.navSettings}
                        </NavLink>
                        <button
                            className="koda-admin-nav-label flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-[#6D6997] hover:bg-[#F8F5FF] hover:text-[#0E0B55] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            type="button"
                            onClick={() => {
                                setProfileOpen(false);
                                toggle();
                            }}
                        >
                            <span>{t.themeMode}</span>
                            <span className="text-xs font-semibold">
                                {resolvedMode === 'dark' ? t.darkMode : t.lightMode}
                            </span>
                        </button>
                        <button
                            className="koda-admin-nav-label flex min-h-10 w-full items-center rounded-xl px-3 text-left text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                            type="button"
                            onClick={signOut}
                        >
                            {t.signOut}
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}

function getRolePlan(role: Role, t: (typeof copy)['en']) {
    if (role === 'admin') return t.adminPlan;
    if (role === 'teacher') return t.teacherPlan;
    if (role === 'parent') return t.parentPlan;
    return t.kidPlan;
}

function getSettingsPath(role: Role) {
    if (role === 'teacher') return '/teacher/settings';
    if (role === 'parent') return '/parent/settings';
    if (role === 'student') return '/student/settings';
    return '/admin/settings';
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
