import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ArrowRight, Baby, CheckCircle2, Clock3, Plus } from 'lucide-react';
import type { ChildProfile, ParentOnboardingState } from '@koda/contracts';
import type { ParentOutletContext } from '../ParentLayout';
import { getParentOnboarding } from '@/lib/api';
import { Card, DataTable, type DataTableColumn } from '@/shared/ui';
import { AdminPageLayout } from '@/features/admin/components/AdminPageLayout';

export default function ParentDashboard() {
    const { token, user } = useOutletContext<ParentOutletContext>();
    const [state, setState] = useState<ParentOnboardingState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        getParentOnboarding(token)
            .then(data => {
                setState(data);
                setError(null);
            })
            .catch(err => setError(err instanceof Error ? err.message : String(err)))
            .finally(() => setLoading(false));
    }, [token]);

    const stats = useMemo(() => {
        const children = state?.children ?? [];
        return {
            children: children.length,
            ready: children.filter(child => !child.disabled_at && child.placement_status === 'complete').length,
            pending: children.filter(child => !child.disabled_at && child.placement_status !== 'complete').length,
        };
    }, [state]);
    const childColumns = useMemo<Array<DataTableColumn<ChildProfile>>>(() => [
        {
            key: 'child',
            label: 'Child',
            render: child => <ChildIdentity child={child} />,
        },
        {
            key: 'age',
            label: 'Age range',
            render: child => (
                <span className="text-sm font-medium text-[#6D6997] dark:text-slate-300">
                    {child.age_range_id || 'Age not set'}
                </span>
            ),
        },
        {
            key: 'subjects',
            label: 'Subjects',
            render: child => <SubjectBadges subjectIds={child.subject_ids} />,
        },
        {
            key: 'status',
            label: 'Status',
            render: child => <ChildStatus child={child} />,
        },
        {
            key: 'registered',
            label: 'Registered',
            render: child => <RegisteredAt value={child.created_at} />,
        },
        {
            key: 'actions',
            label: '',
            className: 'text-right',
            render: () => (
                <Link className="text-sm font-semibold text-[#534AB7] hover:underline dark:text-brand-300" to="/parent/children">
                    Manage
                </Link>
            ),
        },
    ], []);

    return (
        <AdminPageLayout
            className="max-w-6xl"
            description="Manage your kids and their learning profiles."
            title={`Welcome back, ${user.display_name}`}
        >
            {error && (
                <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatCard icon={Baby} label="Children" loading={loading} value={stats.children} />
                <StatCard icon={CheckCircle2} label="Ready" loading={loading} value={stats.ready} tone="success" />
                <StatCard icon={Clock3} label="Need onboarding" loading={loading} value={stats.pending} tone="warning" />
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-[#E7E2F6] bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-[#EEEAF9] px-5 py-4 dark:border-slate-800">
                    <div>
                        <h2 className="koda-admin-section-title">Children</h2>
                        <p className="koda-admin-label mt-1">Each child can have their own placement and learning path.</p>
                    </div>
                    <Link
                        className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-[#DCD7EA] bg-white px-4 text-sm font-semibold text-[#534AB7] shadow-sm transition hover:border-[#BDB4F4] hover:bg-[#FBFAFF] dark:border-slate-700 dark:bg-slate-950 dark:text-brand-300 dark:hover:border-brand-400 dark:hover:bg-slate-800"
                        to="/parent/onboarding"
                    >
                        <Plus className="h-4 w-4" />
                        Add child
                    </Link>
                </div>
                {loading ? (
                    <div>
                        <ChildSkeleton />
                        <ChildSkeleton />
                    </div>
                ) : (
                    <DataTable
                        columns={childColumns}
                        empty={<EmptyChildren />}
                        rowKey={child => child._id}
                        rows={state?.children ?? []}
                    />
                )}
            </div>
        </AdminPageLayout>
    );
}

function StatCard({
    icon: Icon,
    label,
    loading,
    tone = 'primary',
    value,
}: {
    icon: typeof Baby;
    label: string;
    loading: boolean;
    tone?: 'primary' | 'success' | 'warning';
    value: number;
}) {
    const toneClass = {
        primary: 'bg-[#F2EEFF] text-[#534AB7]',
        success: 'bg-emerald-50 text-emerald-700',
        warning: 'bg-amber-50 text-amber-700',
    }[tone];
    return (
        <Card className="border-[#E7E2F6] dark:border-slate-800">
            <div className="flex items-center gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl ${toneClass}`}>
                    <Icon className="h-5 w-5" />
                </span>
                <div>
                    <p className="koda-admin-label">{label}</p>
                    <p className="koda-admin-metric mt-1">{loading ? '-' : value}</p>
                </div>
            </div>
        </Card>
    );
}

function ChildIdentity({ child }: { child: ChildProfile }) {
    return (
        <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#F2EEFF] text-sm font-semibold text-[#534AB7] dark:bg-slate-800 dark:text-brand-300">
                {getInitials(child.display_name)}
            </span>
            <div>
                <p className="font-semibold text-[#0E0B55] dark:text-white">{child.display_name}</p>
                <p className="koda-admin-label mt-0.5">{child.primary_subject_id || 'No placement subject'}</p>
            </div>
        </div>
    );
}

function ChildStatus({ child }: { child: ChildProfile }) {
    const ready = child.placement_status === 'complete';
    const disabled = Boolean(child.disabled_at);
    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                disabled
                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    : ready
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
            }`}
        >
            {disabled ? 'Disabled' : ready ? 'Ready' : 'Needs onboarding'}
        </span>
    );
}

function SubjectBadges({ subjectIds }: { subjectIds: string[] }) {
    if (subjectIds.length === 0) {
        return <span className="text-sm font-medium text-[#8D89AE] dark:text-slate-400">-</span>;
    }
    return (
        <div className="flex flex-wrap gap-1.5">
            {subjectIds.map(subjectId => (
                <span
                    key={subjectId}
                    className="rounded-full bg-[#F2EEFF] px-2.5 py-1 text-xs font-semibold text-[#534AB7] dark:bg-slate-800 dark:text-brand-300"
                >
                    {formatSubject(subjectId)}
                </span>
            ))}
        </div>
    );
}

function formatSubject(subjectId: string) {
    return subjectId
        .split(/[-_]/)
        .filter(Boolean)
        .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(' ');
}

function RegisteredAt({ value }: { value: string }) {
    const date = new Date(value);
    return (
        <div>
            <p className="text-sm font-semibold text-[#0E0B55] dark:text-white">
                {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[#8D89AE] dark:text-slate-400">{relativeAge(date)}</p>
        </div>
    );
}

function EmptyChildren() {
    return (
        <div className="px-5 py-8 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F2EEFF] text-[#534AB7] dark:bg-slate-800 dark:text-brand-300">
                <Baby className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#0E0B55] dark:text-white">No children yet</h3>
            <p className="koda-admin-label mx-auto mt-2 max-w-md">
                Start by adding your first child and running a quick placement check.
            </p>
            <Link
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#534AB7] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#453DA0]"
                to="/parent/onboarding"
            >
                Add first child
                <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
    );
}

function ChildSkeleton() {
    return (
        <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-11 w-11 rounded-full bg-[#F2EEFF] dark:bg-slate-800" />
            <div className="flex-1 space-y-2">
                <div className="h-4 w-36 rounded bg-[#F2EEFF] dark:bg-slate-800" />
                <div className="h-3 w-52 rounded bg-[#F7F4FF] dark:bg-slate-800/70" />
            </div>
        </div>
    );
}

function getInitials(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'K';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function relativeAge(date: Date) {
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / 86_400_000));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    const months = Math.floor(diffDays / 30);
    if (months === 1) return '1 month ago';
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(months / 12);
    return years === 1 ? '1 year ago' : `${years} years ago`;
}
