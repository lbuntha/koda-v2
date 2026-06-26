import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, RefreshCcw, Search, Users } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { AdminUserListItem, Role } from '@koda/contracts';
import type { AdminOutletContext } from '../AdminLayout';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { AdminPageSkeleton } from '../components/AdminSkeleton';
import { ErrorBanner } from './RolesPage';
import { listAdminUsers } from '@/lib/api';
import { copy } from '@/lib/i18n';
import { Button, Card } from '@/shared/ui';

const ROLE_ORDER: Role[] = ['admin', 'teacher', 'parent', 'student'];

export default function UsersPage() {
    const { locale, token } = useOutletContext<AdminOutletContext>();
    const t = copy[locale];
    const [users, setUsers] = useState<AdminUserListItem[]>([]);
    const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
    const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void loadUsers();
    }, [token]);

    async function loadUsers(mode: 'initial' | 'refresh' = 'initial') {
        if (mode === 'refresh') setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            setUsers(await listAdminUsers(token));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const stats = useMemo(() => {
        const active = users.filter(user => !user.disabled_at).length;
        return {
            total: users.length,
            active,
            disabled: users.length - active,
            admins: users.filter(user => user.role === 'admin').length,
            children: users.reduce((count, user) => count + (user.children?.length ?? 0), 0),
        };
    }, [users]);

    const filteredUsers = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return users.filter(user => {
            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const disabled = Boolean(user.disabled_at);
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && !disabled) ||
                (statusFilter === 'disabled' && disabled);
            const matchesQuery =
                !normalizedQuery ||
                user.display_name.toLowerCase().includes(normalizedQuery) ||
                user.email.toLowerCase().includes(normalizedQuery) ||
                user.children?.some(child => child.display_name.toLowerCase().includes(normalizedQuery));
            return matchesRole && matchesStatus && matchesQuery;
        });
    }, [query, roleFilter, statusFilter, users]);

    function toggleParent(userId: string) {
        setExpandedParents(current => {
            const next = new Set(current);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    }

    return (
        <AdminPageLayout
            actions={
                <Button
                    disabled={loading}
                    leftIcon={<RefreshCcw className="h-4 w-4" />}
                    loading={refreshing}
                    loadingText={t.refreshing}
                    variant="outline"
                    onClick={() => void loadUsers('refresh')}
                >
                    {t.refresh}
                </Button>
            }
            description={t.usersPageBody}
            title={t.usersTitle}
        >

            {error && <ErrorBanner message={error} />}
            {loading && !error && <AdminPageSkeleton rows={5} />}

            {!loading && !error && (
                <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <UserStat label={t.totalUsers} value={stats.total} />
                        <UserStat label={t.activeUsers} value={stats.active} tone="success" />
                        <UserStat label={t.childProfiles} value={stats.children} tone="primary" />
                        <UserStat label={t.disabledUsers} value={stats.disabled} tone="warning" />
                    </div>

                    <Card className="mt-4 border-[#E7E2F6]" padded={false}>
                        <div className="flex flex-wrap items-center gap-3 border-b border-[#EEEAF9] p-3 dark:border-slate-800">
                            <label className="relative min-w-[220px] flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D89AE]" />
                                <span className="sr-only">{t.searchUsers}</span>
                                <input
                                    className="h-10 w-full rounded-2xl border border-[#DCD7EA] bg-white pl-9 pr-3 text-sm text-[#0E0B55] outline-none transition placeholder:text-[#8D89AE] focus:border-[#BDB4F4] focus:ring-2 focus:ring-[#E8E2FF] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-slate-800"
                                    placeholder={t.searchUsers}
                                    value={query}
                                    onChange={event => setQuery(event.target.value)}
                                />
                            </label>
                            <select
                                className="h-10 rounded-2xl border border-[#DCD7EA] bg-white px-3 text-sm font-medium text-[#534AB7] outline-none focus:border-[#BDB4F4] focus:ring-2 focus:ring-[#E8E2FF] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                value={roleFilter}
                                onChange={event => setRoleFilter(event.target.value as Role | 'all')}
                            >
                                <option value="all">{t.allRoles}</option>
                                {ROLE_ORDER.map(role => (
                                    <option key={role} value={role}>{formatRole(role)}</option>
                                ))}
                            </select>
                            <select
                                className="h-10 rounded-2xl border border-[#DCD7EA] bg-white px-3 text-sm font-medium text-[#534AB7] outline-none focus:border-[#BDB4F4] focus:ring-2 focus:ring-[#E8E2FF] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                value={statusFilter}
                                onChange={event => setStatusFilter(event.target.value as 'all' | 'active' | 'disabled')}
                            >
                                <option value="all">{t.allStatuses}</option>
                                <option value="active">{t.active}</option>
                                <option value="disabled">{t.disabled}</option>
                            </select>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-0 text-sm">
                                <thead>
                                    <tr className="bg-[#FBFAFF] text-left text-xs font-semibold uppercase text-[#6D6997] dark:bg-slate-950/30 dark:text-slate-400">
                                        <th className="px-4 py-3">{t.user}</th>
                                        <th className="px-4 py-3">{t.role}</th>
                                        <th className="px-4 py-3">{t.children}</th>
                                        <th className="px-4 py-3">{t.status}</th>
                                        <th className="px-4 py-3">{t.locale}</th>
                                        <th className="px-4 py-3">{t.joined}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => {
                                        const children = user.children ?? [];
                                        const canExpand = user.role === 'parent' && children.length > 0;
                                        const expanded = expandedParents.has(user._id);
                                        return (
                                            <Fragment key={user._id}>
                                                <tr className="border-t border-[#EEEAF9] dark:border-slate-800">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                aria-label={expanded ? t.collapseChildren : t.expandChildren}
                                                                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[#6D6997] transition hover:bg-[#F4F1FF] hover:text-[#534AB7] disabled:opacity-35 dark:text-slate-400 dark:hover:bg-slate-800"
                                                                disabled={!canExpand}
                                                                type="button"
                                                                onClick={() => toggleParent(user._id)}
                                                            >
                                                                <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                                            </button>
                                                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F2EEFF] text-sm font-semibold text-[#534AB7] dark:bg-slate-800 dark:text-slate-100">
                                                                {getInitials(user.display_name || user.email)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="koda-admin-card-title truncate">{user.display_name}</p>
                                                                <p className="koda-admin-label mt-0.5 truncate text-xs">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <RoleChip role={user.role} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {user.role === 'parent' ? (
                                                            <span className="koda-admin-chip rounded-full bg-[#FBFAFF] px-3 py-1 text-[#6D6997] dark:bg-slate-800 dark:text-slate-300">
                                                                {children.length} {children.length === 1 ? t.child : t.children}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[#8D89AE] dark:text-slate-500">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatusChip disabled={Boolean(user.disabled_at)} t={t} />
                                                    </td>
                                                    <td className="px-4 py-3 text-[#6D6997] dark:text-slate-300">
                                                        {user.locale.toUpperCase()}
                                                    </td>
                                                    <td className="px-4 py-3 text-[#6D6997] dark:text-slate-300">
                                                        {formatDate(user.created_at, locale)}
                                                    </td>
                                                </tr>
                                                {expanded && (
                                                    <tr className="border-t border-[#EEEAF9] dark:border-slate-800">
                                                        <td colSpan={6} className="bg-[#FBFAFF] px-4 py-3 dark:bg-slate-950/30">
                                                            <div className="ml-11 grid gap-2">
                                                                {children.map(child => (
                                                                    <div key={child._id} className="grid gap-3 rounded-2xl border border-[#EEEAF9] bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[1.3fr_0.7fr_0.7fr_0.8fr]">
                                                                        <div className="min-w-0">
                                                                            <p className="koda-admin-card-title truncate">{child.display_name}</p>
                                                                            <p className="koda-admin-label mt-1 text-xs">{t.childProfile}</p>
                                                                        </div>
                                                                        <ChildMeta label={t.grade} value={child.grade || t.notSet} />
                                                                        <ChildMeta label={t.activeSkills} value={String(child.active_skill_ids.length)} />
                                                                        <ChildMeta label={t.joined} value={formatDate(child.created_at, locale)} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {filteredUsers.length === 0 && (
                            <div className="grid place-items-center px-4 py-12 text-center">
                                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F2EEFF] text-[#534AB7] dark:bg-slate-800 dark:text-slate-100">
                                    <Users className="h-5 w-5" />
                                </div>
                                <p className="koda-admin-card-title mt-3">{t.noUsersFound}</p>
                                <p className="koda-admin-label mt-1">{t.noUsersFoundBody}</p>
                            </div>
                        )}
                    </Card>
                </>
            )}
        </AdminPageLayout>
    );
}

function UserStat({ label, value, tone = 'muted' }: { label: string; value: number; tone?: 'muted' | 'primary' | 'success' | 'warning' }) {
    const toneClass = {
        muted: 'bg-[#FBFAFF] text-[#6D6997]',
        primary: 'bg-[#F2EEFF] text-[#534AB7]',
        success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
        warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    }[tone];

    return (
        <Card className="border-[#E7E2F6] p-4">
            <p className="koda-admin-label">{label}</p>
            <p className={`koda-admin-metric mt-2 inline-flex min-w-14 justify-center rounded-2xl px-3 py-1 ${toneClass}`}>
                {value}
            </p>
        </Card>
    );
}

function ChildMeta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="koda-admin-chip uppercase text-[#8D89AE]">{label}</p>
            <p className="mt-1 text-sm font-medium text-[#0E0B55] dark:text-white">{value}</p>
        </div>
    );
}

function RoleChip({ role }: { role: Role }) {
    const className =
        role === 'admin'
            ? 'bg-[#F2EEFF] text-[#534AB7]'
            : role === 'teacher'
              ? 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
              : role === 'parent'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    return <span className={`koda-admin-chip rounded-full px-3 py-1 ${className}`}>{formatRole(role)}</span>;
}

function StatusChip({ disabled, t }: { disabled: boolean; t: (typeof copy)['en'] }) {
    return (
        <span className={`koda-admin-chip rounded-full px-3 py-1 ${disabled ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>
            {disabled ? t.disabled : t.active}
        </span>
    );
}

function formatRole(role: Role) {
    return role.replace(/^\w/, char => char.toUpperCase());
}

function getInitials(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatDate(value: string, locale: string) {
    return new Intl.DateTimeFormat(locale === 'km' ? 'km-KH' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}
