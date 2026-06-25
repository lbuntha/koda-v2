import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Role, RolesSettings } from '@koda/contracts';
import type { AdminOutletContext } from '../AdminLayout';
import { isSuperadmin } from '../hooks/useAdminAuth';
import { getRoleSettings, updateRoleSettings } from '@/lib/api';
import { copy } from '@/lib/i18n';
import { Button, Card } from '@/shared/ui';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function RolesPage() {
    const { locale, token, user } = useOutletContext<AdminOutletContext>();
    const t = copy[locale];
    const canEdit = isSuperadmin(user.role);

    const [initial, setInitial] = useState<RolesSettings | null>(null);
    const [draft, setDraft] = useState<RolesSettings | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saveState, setSaveState] = useState<SaveState>('idle');

    useEffect(() => {
        getRoleSettings(token)
            .then(value => {
                setInitial(value);
                setDraft(value);
            })
            .catch(err => setError(err instanceof Error ? err.message : String(err)));
    }, [token]);

    const dirty = useMemo(() => JSON.stringify(initial) !== JSON.stringify(draft), [initial, draft]);

    function togglePermission(role: Role, key: string) {
        if (!draft || !canEdit) return;
        setDraft({
            ...draft,
            roles: draft.roles.map(item => {
                if (item.role !== role) return item;
                const has = item.permissions.includes(key);
                return {
                    ...item,
                    permissions: has
                        ? item.permissions.filter(p => p !== key)
                        : [...item.permissions, key],
                };
            }),
        });
        setSaveState('idle');
    }

    async function save() {
        if (!draft) return;
        setSaveState('saving');
        setError(null);
        try {
            const next = await updateRoleSettings(token, draft);
            setInitial(next);
            setDraft(next);
            setSaveState('saved');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setSaveState('error');
        }
    }

    return (
        <section className="max-w-5xl">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-wide text-brand-600 dark:text-brand-400">
                        {t.adminConsole}
                    </p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {t.rolesTitle}
                    </h1>
                    <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">{t.rolesBody}</p>
                </div>
                {!canEdit && <ReadOnlyPill label={t.readOnly} />}
            </header>

            {error && <ErrorBanner message={error} />}

            {draft && (
                <Card className="mt-6 overflow-x-auto" padded={false}>
                    <table className="min-w-full border-separate border-spacing-0 text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500 dark:bg-slate-950/30 dark:text-slate-400">
                                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 dark:bg-slate-950/30">
                                    {t.permissions}
                                </th>
                                {draft.roles.map(role => (
                                    <th key={role.role} className="px-4 py-3 text-center">
                                        {role.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {draft.permissions.map(permission => (
                                <tr key={permission.key} className="border-t border-slate-100 dark:border-slate-800">
                                    <td className="sticky left-0 z-10 bg-white px-4 py-3 align-top dark:bg-slate-900">
                                        <p className="font-bold text-slate-900 dark:text-white">{permission.label}</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {permission.description}
                                        </p>
                                        <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                                            {permission.key}
                                        </p>
                                    </td>
                                    {draft.roles.map(role => {
                                        const checked = role.permissions.includes(permission.key);
                                        return (
                                            <td key={role.role} className="px-4 py-3 text-center">
                                                <input
                                                    aria-label={`${role.label} – ${permission.label}`}
                                                    checked={checked}
                                                    className="h-5 w-5 rounded border-slate-300 text-brand-500 focus:ring-brand-500 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800"
                                                    disabled={!canEdit}
                                                    type="checkbox"
                                                    onChange={() => togglePermission(role.role, permission.key)}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            {canEdit && (
                <SaveBar
                    dirty={dirty}
                    saveState={saveState}
                    t={t}
                    onRevert={() => {
                        setDraft(initial);
                        setSaveState('idle');
                    }}
                    onSave={save}
                />
            )}
        </section>
    );
}

export function ReadOnlyPill({ label }: { label: string }) {
    return (
        <p className="rounded-2xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
            {label}
        </p>
    );
}

export function ErrorBanner({ message }: { message: string }) {
    return (
        <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {message}
        </p>
    );
}

export function SaveBar({
    dirty,
    saveState,
    t,
    onRevert,
    onSave,
}: {
    dirty: boolean;
    saveState: SaveState;
    t: (typeof copy)['en'];
    onRevert: () => void;
    onSave: () => void;
}) {
    return (
        <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {saveState === 'saved' && !dirty ? t.saved : ''}
            </p>
            <div className="flex gap-2">
                <Button
                    disabled={!dirty || saveState === 'saving'}
                    variant="outline"
                    onClick={onRevert}
                >
                    {t.revert}
                </Button>
                <Button
                    disabled={!dirty || saveState === 'saving'}
                    loading={saveState === 'saving'}
                    loadingText={t.saving}
                    onClick={onSave}
                >
                    {t.save}
                </Button>
            </div>
        </div>
    );
}
