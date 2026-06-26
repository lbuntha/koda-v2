import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Baby, Plus, Power, RotateCcw, Trash2 } from 'lucide-react';
import type { ChildProfile, ParentOnboardingState } from '@koda/contracts';
import type { ParentOutletContext } from '../ParentLayout';
import { deleteChildProfile, disableChildProfile, enableChildProfile, getParentOnboarding } from '@/lib/api';
import { AdminPageLayout } from '@/features/admin/components/AdminPageLayout';
import { Button, ConfirmDialog } from '@/shared/ui';

type ConfirmAction = 'disable' | 'enable' | 'delete';

export default function ParentChildrenPage() {
    const { token } = useOutletContext<ParentOutletContext>();
    const [state, setState] = useState<ParentOnboardingState | null>(null);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<{ action: ConfirmAction; child: ChildProfile } | null>(null);

    useEffect(() => {
        loadChildren();
    }, [token]);

    async function loadChildren() {
        setLoading(true);
        setError(null);
        try {
            setState(await getParentOnboarding(token));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }

    async function runConfirmedAction() {
        if (!confirm) return;
        setBusyId(confirm.child._id);
        setError(null);
        try {
            if (confirm.action === 'disable') {
                await disableChildProfile(token, confirm.child._id);
            } else if (confirm.action === 'enable') {
                await enableChildProfile(token, confirm.child._id);
            } else {
                await deleteChildProfile(token, confirm.child._id);
            }
            setConfirm(null);
            await loadChildren();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusyId(null);
        }
    }

    const children = state?.children ?? [];

    return (
        <AdminPageLayout
            actions={
                <Link className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-[#534AB7] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#453DA0] dark:bg-brand-400 dark:text-slate-950 dark:hover:bg-brand-200" to="/parent/onboarding">
                    <Plus className="h-4 w-4" />
                    Add kid
                </Link>
            }
            className="max-w-6xl"
            description="Manage kid profiles that can be selected from the profile switcher."
            title="Children"
        >
            {error && (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>
            )}

            <div className="mt-5 overflow-hidden rounded-3xl border border-[#E7E2F6] bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-[#EEEAF9] px-5 py-4 dark:border-slate-800">
                    <h2 className="koda-admin-section-title">Kid profiles</h2>
                    <p className="koda-admin-label mt-1">Disabled profiles cannot log in or start placement.</p>
                </div>
                <div className="divide-y divide-[#EEEAF9] dark:divide-slate-800">
                    {loading && (
                        <>
                            <ChildSkeleton />
                            <ChildSkeleton />
                        </>
                    )}
                    {!loading && children.length === 0 && (
                        <div className="px-5 py-10 text-center">
                            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F2EEFF] text-[#534AB7] dark:bg-brand-400/15 dark:text-brand-200">
                                <Baby className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 text-lg font-semibold text-[#0E0B55] dark:text-white">No kids yet</h3>
                            <p className="koda-admin-label mx-auto mt-2 max-w-md">
                                Add a kid profile before starting placement.
                            </p>
                        </div>
                    )}
                    {!loading && children.map(child => (
                        <ChildRow
                            key={child._id}
                            busy={busyId === child._id}
                            child={child}
                            onConfirm={action => setConfirm({ action, child })}
                        />
                    ))}
                </div>
            </div>

            <ConfirmDialog
                destructive={confirm?.action === 'delete'}
                open={Boolean(confirm)}
                title={confirm ? confirmTitle(confirm.action, confirm.child.display_name) : ''}
                body={confirm ? confirmBody(confirm.action, confirm.child.display_name) : null}
                confirmLabel={confirm?.action === 'delete' ? 'Delete' : confirm?.action === 'disable' ? 'Disable' : 'Enable'}
                onCancel={() => setConfirm(null)}
                onConfirm={runConfirmedAction}
            />
        </AdminPageLayout>
    );
}

function ChildRow({
    busy,
    child,
    onConfirm,
}: {
    busy: boolean;
    child: ChildProfile;
    onConfirm: (action: ConfirmAction) => void;
}) {
    const disabled = Boolean(child.disabled_at);
    return (
        <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#F2EEFF] text-sm font-semibold text-[#534AB7] dark:bg-brand-400/15 dark:text-brand-200">
                    {getInitials(child.display_name)}
                </span>
                <div>
                    <p className="font-semibold text-[#0E0B55] dark:text-white">{child.display_name}</p>
                    <p className="koda-admin-label mt-0.5">
                        {child.age_range_id || 'Age not set'} · {child.subject_ids.length} subjects
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        disabled
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            : child.placement_status === 'complete'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300'
                    }`}
                >
                    {disabled ? 'Disabled' : child.placement_status === 'complete' ? 'Ready' : 'Needs placement'}
                </span>
                {disabled ? (
                    <Button
                        disabled={busy}
                        leftIcon={<RotateCcw className="h-4 w-4" />}
                        size="sm"
                        variant="outline"
                        onClick={() => onConfirm('enable')}
                    >
                        Enable
                    </Button>
                ) : (
                    <Button
                        disabled={busy}
                        leftIcon={<Power className="h-4 w-4" />}
                        size="sm"
                        variant="outline"
                        onClick={() => onConfirm('disable')}
                    >
                        Disable
                    </Button>
                )}
                <Button
                    disabled={busy}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    size="sm"
                    variant="destructive"
                    onClick={() => onConfirm('delete')}
                >
                    Delete
                </Button>
            </div>
        </div>
    );
}

function ChildSkeleton() {
    return (
        <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-11 w-11 rounded-full bg-[#F2EEFF] dark:bg-slate-800" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-36 rounded bg-[#F2EEFF] dark:bg-slate-800" />
                <div className="h-3 w-52 rounded bg-[#F7F4FF] dark:bg-slate-800/80" />
            </div>
        </div>
    );
}

function confirmTitle(action: ConfirmAction, name: string) {
    if (action === 'delete') return `Delete ${name}?`;
    if (action === 'disable') return `Disable ${name}?`;
    return `Enable ${name}?`;
}

function confirmBody(action: ConfirmAction, name: string) {
    if (action === 'delete') {
        return `${name} will be removed from your children list. Placement sessions for this kid will also be removed.`;
    }
    if (action === 'disable') {
        return `${name} will no longer be able to log in from the profile switcher. You can enable this profile again later.`;
    }
    return `${name} will be able to log in again from the profile switcher.`;
}

function getInitials(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'K';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
