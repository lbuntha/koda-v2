import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { MenuItem, MenuScope, MenuSection, MenusSettings, Role } from '@koda/contracts';
import { ICON_REGISTRY, ROUTE_REGISTRY } from '@koda/contracts';
import type { AdminOutletContext } from '../AdminLayout';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { isAdminRole } from '../hooks/useAdminAuth';
import {
    createMenuItem,
    deleteMenuItem,
    getMenuSettings,
    getRoleSettings,
    reseedSettings,
    updateMenuItem,
} from '@/lib/api';
import { copy } from '@/lib/i18n';
import { Button, Card, DataTable, Input, type DataTableColumn } from '@/shared/ui';
import { AdminPageSkeleton } from '../components/AdminSkeleton';
import { ErrorBanner, ReadOnlyPill } from './RolesPage';

const SCOPES: MenuScope[] = ['student', 'parent', 'teacher', 'admin', 'all'];
const SECTIONS: MenuSection[] = ['top', 'manage'];
const ROLE_FILTERS: Array<Role | 'all'> = ['all', 'admin', 'teacher', 'parent', 'student'];

type DrawerMode = { kind: 'add' } | { kind: 'edit'; item: MenuItem };

export default function MenusPage() {
    const { locale, token, user } = useOutletContext<AdminOutletContext>();
    const t = copy[locale];
    const canEdit = isAdminRole(user.role);

    const [menus, setMenus] = useState<MenusSettings | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);
    const [drawer, setDrawer] = useState<DrawerMode | null>(null);
    const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
    const [query, setQuery] = useState('');

    useEffect(() => {
        Promise.all([getMenuSettings(token), getRoleSettings(token)])
            .then(([m, r]) => {
                setMenus(m);
                setPermissions(r.permissions.map(p => p.key));
            })
            .catch(err => setError(err instanceof Error ? err.message : String(err)));
    }, [token]);

    const sortedItems = useMemo(
        () => (menus ? [...menus.items].sort((a, b) => a.order - b.order) : []),
        [menus],
    );

    const filteredItems = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return sortedItems
            .filter(item => roleFilter === 'all' || item.scope === 'all' || item.scope === roleFilter)
            .filter(item => {
                if (!normalizedQuery) return true;
                return [
                    item.id,
                    item.label_key,
                    item.route,
                    item.icon,
                    item.section,
                    item.scope,
                    item.permission ?? '',
                ].some(value => value.toLowerCase().includes(normalizedQuery));
            });
    }, [query, roleFilter, sortedItems]);

    async function refreshMenus() {
        const m = await getMenuSettings(token);
        setMenus(m);
    }

    async function handleDelete(id: string) {
        if (!canEdit) return;
        if (!window.confirm(t.deleteMenuConfirm)) return;
        setError(null);
        try {
            await deleteMenuItem(token, id);
            await refreshMenus();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }

    async function handleSaveDrawer(item: MenuItem) {
        if (!drawer) return;
        if (drawer.kind === 'add') await createMenuItem(token, item);
        else await updateMenuItem(token, item);
        await refreshMenus();
        setDrawer(null);
    }

    async function resetMenus() {
        if (!canEdit) return;
        if (!window.confirm(t.resetConfirm)) return;
        setResetting(true);
        setError(null);
        try {
            await reseedSettings(token, 'menus');
            await refreshMenus();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setResetting(false);
        }
    }

    return (
        <AdminPageLayout
            actions={
                canEdit ? (
                    <>
                        <Button
                            disabled={resetting}
                            loading={resetting}
                            loadingText={t.resetting}
                            variant="outline"
                            onClick={resetMenus}
                        >
                            {t.resetDefaults}
                        </Button>
                        <Button onClick={() => setDrawer({ kind: 'add' })}>{t.menuAddItem}</Button>
                    </>
                ) : (
                    <ReadOnlyPill label={t.readOnly} />
                )
            }
            className="max-w-6xl"
            description={t.menusBody}
            title={t.menusTitle}
        >

            {error && <ErrorBanner message={error} />}
            {!menus && !error && <AdminPageSkeleton rows={6} />}

            {menus && (
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="relative min-w-[240px] flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D89AE]" />
                            <span className="sr-only">Search menus</span>
                            <input
                                className="h-10 w-full rounded-2xl border border-[#DCD7EA] bg-white pl-9 pr-3 text-sm text-[#0E0B55] outline-none transition placeholder:text-[#8D89AE] focus:border-[#BDB4F4] focus:ring-2 focus:ring-[#E8E2FF] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-slate-800"
                                placeholder="Search menus"
                                value={query}
                                onChange={event => setQuery(event.target.value)}
                            />
                        </label>
                        <RoleFilter value={roleFilter} items={sortedItems} t={t} onChange={setRoleFilter} />
                    </div>

                    <Card className="mt-4 border-[#E7E2F6]" padded={false}>
                        <MenuTable
                            canEdit={canEdit}
                            items={filteredItems}
                            t={t}
                            onDelete={handleDelete}
                            onEdit={item => setDrawer({ kind: 'edit', item })}
                        />
                    </Card>
                </div>
            )}

            {drawer && menus && (
                <MenuDrawer
                    existingIds={menus.items.map(i => i.id)}
                    mode={drawer}
                    nextOrder={(menus.items.reduce((max, i) => Math.max(max, i.order), 0) ?? 0) + 10}
                    permissions={permissions}
                    t={t}
                    onCancel={() => setDrawer(null)}
                    onSave={handleSaveDrawer}
                />
            )}
        </AdminPageLayout>
    );
}

function MenuTable({
    canEdit,
    items,
    t,
    onDelete,
    onEdit,
}: {
    canEdit: boolean;
    items: MenuItem[];
    t: (typeof copy)['en'];
    onDelete: (id: string) => void;
    onEdit: (item: MenuItem) => void;
}) {
    const columns: Array<DataTableColumn<MenuItem>> = [
        {
            key: 'menu',
            label: t.menuLabel,
            render: item => (
                <div className="flex min-w-[260px] items-center gap-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${item.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0E0B55] dark:text-white">{item.label_key}</p>
                        <p className="truncate font-mono text-[11px] text-[#8D89AE] dark:text-slate-500">
                            {item.id}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'route',
            label: t.menuRoute,
            render: item => (
                <p className="min-w-[150px] truncate font-mono text-xs font-medium text-[#6D6997] dark:text-slate-300">
                    {item.route}
                </p>
            ),
        },
        {
            key: 'scope',
            label: t.menuScope,
            render: item => (
                <span className="rounded-full bg-[#F2EEFF] px-2.5 py-1 text-xs font-semibold uppercase text-[#534AB7] dark:bg-slate-800 dark:text-slate-300">
                    {item.scope === 'all' ? t.scopeAll : item.scope}
                </span>
            ),
        },
        {
            key: 'section',
            label: t.menuSection,
            render: item => (
                <span className="text-sm font-medium text-[#6D6997] dark:text-slate-300">
                    {item.section === 'top' ? t.menuSectionTop : t.menuSectionManage}
                </span>
            ),
        },
        {
            key: 'permission',
            label: t.menuPermission,
            render: item => (
                <span className="font-mono text-xs text-[#8D89AE] dark:text-slate-500">
                    {item.permission || '-'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'text-right',
            render: item => canEdit ? (
                <div className="flex justify-end gap-3">
                    <button
                        className="text-sm font-semibold text-[#534AB7] hover:underline dark:text-brand-300"
                        type="button"
                        onClick={() => onEdit(item)}
                    >
                        Edit
                    </button>
                    <button
                        className="text-sm font-semibold text-rose-600 hover:underline dark:text-rose-400"
                        type="button"
                        onClick={() => onDelete(item.id)}
                    >
                        Remove
                    </button>
                </div>
            ) : null,
        },
    ];

    return (
        <DataTable
            columns={columns}
            empty="No menu items match this role."
            rows={items}
            rowKey={item => item.id}
        />
    );
}

function RoleFilter({
    items,
    t,
    value,
    onChange,
}: {
    items: MenuItem[];
    t: (typeof copy)['en'];
    value: Role | 'all';
    onChange: (value: Role | 'all') => void;
}) {
    return (
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-[#E7E2F6] bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {ROLE_FILTERS.map(role => {
                const active = value === role;
                const count = role === 'all'
                    ? items.length
                    : items.filter(item => item.scope === 'all' || item.scope === role).length;
                return (
                    <button
                        key={role}
                        className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                            active
                                ? 'bg-[#F2EEFF] text-[#534AB7] shadow-sm dark:bg-slate-800 dark:text-white'
                                : 'text-[#6D6997] hover:bg-[#FBFAFF] hover:text-[#0E0B55] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                        }`}
                        type="button"
                        onClick={() => onChange(role)}
                    >
                        <span>{role === 'all' ? t.allRoles : formatRole(role)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            active
                                ? 'bg-white text-[#534AB7] dark:bg-slate-900 dark:text-white'
                                : 'bg-[#F2EEFF] text-[#534AB7] dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function formatRole(role: Role) {
    return role.replace(/^\w/, char => char.toUpperCase());
}

function MenuDrawer({
    existingIds,
    mode,
    nextOrder,
    permissions,
    t,
    onCancel,
    onSave,
}: {
    existingIds: string[];
    mode: DrawerMode;
    nextOrder: number;
    permissions: string[];
    t: (typeof copy)['en'];
    onCancel: () => void;
    onSave: (item: MenuItem) => Promise<void>;
}) {
    const isAdd = mode.kind === 'add';
    const firstRoute = ROUTE_REGISTRY[0];

    const [draft, setDraft] = useState<MenuItem>(() =>
        mode.kind === 'edit'
            ? mode.item
            : {
                  id: '',
                  label_key: 'navOverview',
                  route: firstRoute.route,
                  icon: 'LayoutDashboard',
                  section: 'top',
                  scope: firstRoute.scopes[0],
                  permission: null,
                  end: false,
                  order: nextOrder,
                  enabled: true,
              },
    );
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const validId = /^[a-z][a-z0-9_.]+$/.test(draft.id);
    const idTaken = isAdd && existingIds.includes(draft.id);
    const routeOptions = ROUTE_REGISTRY.filter(r => draft.scope === 'all' || r.scopes.includes(draft.scope));

    async function submit() {
        if (!validId || idTaken) return;
        setSubmitting(true);
        setLocalError(null);
        try {
            await onSave(draft);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : String(err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex">
            <button
                aria-label={t.cancel}
                className="flex-1 bg-slate-900/40 backdrop-blur-sm"
                type="button"
                onClick={onCancel}
            />
            <aside className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-6 shadow-2xl dark:bg-slate-900">
                <header>
                    <h3 className="koda-admin-section-title">{isAdd ? t.addMenuTitle : t.editMenuTitle}</h3>
                    {isAdd && <p className="koda-admin-label mt-1 text-xs">{t.addMenuBody}</p>}
                </header>

                <div className="mt-4 space-y-3">
                    <label className="block">
                        <span className="koda-admin-label text-xs">{t.menuId}</span>
                        <Input
                            disabled={!isAdd}
                            placeholder="admin.exports"
                            value={draft.id}
                            onChange={e => setDraft(d => ({ ...d, id: e.target.value }))}
                        />
                        {isAdd && draft.id && !validId && (
                            <p className="mt-1 text-xs text-rose-600">Use lower-case letters, digits, dots, underscores.</p>
                        )}
                        {idTaken && <p className="mt-1 text-xs text-rose-600">ID already in use.</p>}
                    </label>

                    <label className="block">
                        <span className="koda-admin-label text-xs">{t.menuLabel}</span>
                        <Input
                            value={draft.label_key}
                            onChange={e => setDraft(d => ({ ...d, label_key: e.target.value }))}
                        />
                    </label>

                    <label className="block">
                        <span className="koda-admin-label text-xs">{t.menuScope}</span>
                        <select
                            className="mt-1 w-full rounded-lg border border-[#E7E2F6] bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                            value={draft.scope}
                            onChange={e => {
                                const next = e.target.value as MenuScope;
                                const fallback = ROUTE_REGISTRY.find(r => next === 'all' || r.scopes.includes(next));
                                setDraft(d => ({ ...d, scope: next, route: fallback?.route ?? d.route }));
                            }}
                        >
                            {SCOPES.map(s => (
                                <option key={s} value={s}>
                                    {s === 'all' ? t.scopeAll : s}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="koda-admin-label text-xs">{t.menuRoute}</span>
                        <select
                            className="mt-1 w-full rounded-lg border border-[#E7E2F6] bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                            value={draft.route}
                            onChange={e => setDraft(d => ({ ...d, route: e.target.value }))}
                        >
                            {routeOptions.map(r => (
                                <option key={r.route} value={r.route}>
                                    {r.route}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="koda-admin-label text-xs">{t.menuIcon}</span>
                            <select
                                className="mt-1 w-full rounded-lg border border-[#E7E2F6] bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                                value={draft.icon}
                                onChange={e => setDraft(d => ({ ...d, icon: e.target.value }))}
                            >
                                {ICON_REGISTRY.map(name => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="koda-admin-label text-xs">{t.menuSection}</span>
                            <select
                                className="mt-1 w-full rounded-lg border border-[#E7E2F6] bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                                value={draft.section}
                                onChange={e => setDraft(d => ({ ...d, section: e.target.value as MenuSection }))}
                            >
                                {SECTIONS.map(s => (
                                    <option key={s} value={s}>
                                        {s === 'top' ? t.menuSectionTop : t.menuSectionManage}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label className="block">
                        <span className="koda-admin-label text-xs">{t.menuPermission}</span>
                        <select
                            className="mt-1 w-full rounded-lg border border-[#E7E2F6] bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                            value={draft.permission ?? ''}
                            onChange={e => setDraft(d => ({ ...d, permission: e.target.value || null }))}
                        >
                            <option value="">—</option>
                            {permissions.map(p => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="koda-admin-label text-xs">{t.menuOrder}</span>
                            <Input
                                max={10000}
                                min={0}
                                type="number"
                                value={String(draft.order)}
                                onChange={e => setDraft(d => ({ ...d, order: Number(e.target.value) || 0 }))}
                            />
                        </label>
                        <label className="flex items-end gap-2 pb-2">
                            <input
                                checked={draft.enabled}
                                className="h-5 w-5 rounded border-slate-300 text-brand-500 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-800"
                                type="checkbox"
                                onChange={e => setDraft(d => ({ ...d, enabled: e.target.checked }))}
                            />
                            <span className="koda-admin-label text-xs">{t.menuEnabled}</span>
                        </label>
                    </div>
                </div>

                {localError && (
                    <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                        {localError}
                    </p>
                )}

                <div className="mt-auto flex justify-end gap-2 pt-5">
                    <Button disabled={submitting} variant="outline" onClick={onCancel}>
                        {t.cancel}
                    </Button>
                    <Button
                        disabled={!validId || idTaken || submitting}
                        loading={submitting}
                        loadingText={isAdd ? t.creating : t.saving}
                        onClick={submit}
                    >
                        {isAdd ? t.create : t.save}
                    </Button>
                </div>
            </aside>
        </div>
    );
}
