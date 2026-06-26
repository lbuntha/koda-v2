import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, Home, LogOut, Moon, Settings, Shuffle, Sun, Trophy, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { ChildProfile, ChildProfileSession } from '@koda/contracts';
import { useTheme } from '@/shared/theme/ThemeProvider';

const CHILD_SESSION_KEY = 'koda.childProfileSession';

const NAV_ITEMS: Array<{ end?: boolean; icon: LucideIcon; label: string; to: string }> = [
    { end: true, icon: Home, label: 'Home', to: '/kid' },
    { icon: BookOpen, label: 'Learn', to: '/kid/learn' },
    { icon: Trophy, label: 'Rewards', to: '/kid/rewards' },
    { icon: BarChart3, label: 'Progress', to: '/kid/progress' },
    { icon: Settings, label: 'Settings', to: '/kid/settings' },
];

export default function KidLayout() {
    const navigate = useNavigate();
    const [session, setSession] = useState<ChildProfileSession | null>(null);
    const updateChild = useCallback((child: ChildProfile) => {
        setSession(current => {
            if (!current) return current;
            const nextSession = { ...current, child };
            window.sessionStorage.setItem(CHILD_SESSION_KEY, JSON.stringify(nextSession));
            return nextSession;
        });
    }, []);

    useEffect(() => {
        const raw = window.sessionStorage.getItem(CHILD_SESSION_KEY);
        if (!raw) {
            navigate('/parent/onboarding', { replace: true });
            return;
        }
        try {
            setSession(JSON.parse(raw) as ChildProfileSession);
        } catch {
            window.sessionStorage.removeItem(CHILD_SESSION_KEY);
            navigate('/parent/onboarding', { replace: true });
        }
    }, [navigate]);

    if (!session) {
        return (
            <div className="flex min-h-screen bg-[#FBFAFF] p-5 dark:bg-slate-950">
                <div className="h-28 flex-1 rounded-3xl bg-white shadow-sm dark:bg-slate-900" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#FBFAFF] text-[#0E0B55] dark:bg-slate-950 dark:text-white">
            <KidSidebar session={session} />
            <main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-5">
                <Outlet
                    context={{
                        childToken: session.child_token,
                        child: session.child,
                        updateChild,
                    }}
                />
            </main>
        </div>
    );
}

export interface KidOutletContext {
    childToken: string;
    child: ChildProfileSession['child'];
    updateChild: (child: ChildProfile) => void;
}

function KidSidebar({ session }: { session: ChildProfileSession }) {
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
    const { resolvedMode, toggle } = useTheme();
    const child = session.child;

    function switchProfile() {
        setProfileOpen(false);
        window.sessionStorage.removeItem(CHILD_SESSION_KEY);
        navigate('/profiles', { replace: true });
    }

    function logOut() {
        setProfileOpen(false);
        window.sessionStorage.removeItem(CHILD_SESSION_KEY);
        navigate('/login', { replace: true });
    }

    return (
        <aside className="flex h-screen w-[264px] shrink-0 flex-col border-r border-[#E7E2F6] bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 p-5 pb-4">
                <img alt="Koda" className="h-10 w-10 rounded-2xl object-cover shadow-sm" src="/icons/icon-192.png" />
                <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-[#0E0B55] dark:text-white">Koda</p>
                    <p className="text-xs font-semibold text-[#8D89AE] dark:text-slate-400">Kid</p>
                </div>
            </div>

            <nav className="space-y-1 px-4">
                {NAV_ITEMS.map(item => (
                    <SidebarLink key={item.to} end={item.end} icon={item.icon} label={item.label} to={item.to} />
                ))}
            </nav>

            <div className="relative mt-auto border-t border-[#F0ECFA] p-4 dark:border-slate-800">
                <button
                    className="flex w-full items-center gap-3 rounded-[1.35rem] bg-[#FBFAFF] p-3 text-left transition hover:bg-[#F5F1FF] dark:bg-slate-950 dark:hover:bg-slate-800"
                    type="button"
                    onClick={() => setProfileOpen(open => !open)}
                >
                    <KidAvatar child={child} />
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-semibold text-[#111827] dark:text-white">{child.display_name}</span>
                        <span className="block truncate text-sm font-medium text-[#77736F] dark:text-slate-400">Kid profile</span>
                    </span>
                </button>
                {profileOpen && (
                    <div className="absolute bottom-full left-4 right-4 mb-2 rounded-2xl border border-[#E7E2F6] bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-950">
                        <button
                            className="koda-admin-nav-label flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-[#6D6997] hover:bg-[#F8F5FF] hover:text-[#0E0B55] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            type="button"
                            onClick={switchProfile}
                        >
                            <Shuffle className="h-4 w-4" />
                            Switch profile
                        </button>
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
                            onClick={logOut}
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

function KidAvatar({ child }: { child: ChildProfileSession['child'] }) {
    if (child.avatar_svg) {
        return (
            <span
                aria-label={`${child.display_name} avatar`}
                className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#F2EEFF] shadow-sm dark:bg-slate-800"
                dangerouslySetInnerHTML={{ __html: child.avatar_svg }}
                role="img"
            />
        );
    }
    if (child.avatar_url) {
        return (
            <img
                alt={child.display_name}
                className="h-12 w-12 shrink-0 rounded-full object-cover shadow-sm"
                src={child.avatar_url}
            />
        );
    }
    return (
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7C6DD8] to-[#534AB7] text-lg font-semibold text-white shadow-sm">
            {getInitials(child.display_name)}
        </div>
    );
}

function SidebarLink({ end, icon: Icon, label, to }: { end?: boolean; icon: LucideIcon; label: string; to: string }) {
    return (
        <NavLink
            end={end}
            to={to}
            className={({ isActive }) =>
                `koda-admin-nav-label flex min-h-11 items-center gap-3 rounded-2xl px-3 transition ${
                    isActive
                        ? 'border border-[#D9D2F4] bg-[#F2EEFF] text-[#534AB7] shadow-sm dark:border-brand-400/30 dark:bg-brand-400/15 dark:text-brand-200'
                        : 'text-[#6D6997] hover:bg-[#F8F5FF] hover:text-[#0E0B55] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`
            }
        >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="truncate">{label}</span>
        </NavLink>
    );
}

function getInitials(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'K';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
