import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { AdminOutletContext } from '../AdminLayout';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { AdminPageSkeleton } from '../components/AdminSkeleton';
import { ErrorBanner } from './RolesPage';
import { getHealth, type Health } from '@/lib/api';
import { copy } from '@/lib/i18n';
import { Button, Card } from '@/shared/ui';

type LoadState = 'loading' | 'ready' | 'error';

export default function SystemStatusPage() {
    const { locale } = useOutletContext<AdminOutletContext>();
    const t = copy[locale];
    const [health, setHealth] = useState<Health | null>(null);
    const [loadState, setLoadState] = useState<LoadState>('loading');
    const [error, setError] = useState<string | null>(null);

    async function loadHealth() {
        setLoadState('loading');
        setError(null);
        try {
            const next = await getHealth();
            setHealth(next);
            setLoadState('ready');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setHealth(null);
            setLoadState('error');
        }
    }

    useEffect(() => {
        void loadHealth();
    }, []);

    return (
        <AdminPageLayout
            actions={
                <Button className="gap-2" loading={loadState === 'loading'} loadingText={t.refreshing} variant="outline" onClick={loadHealth}>
                    <RefreshCw aria-hidden="true" className="h-4 w-4" />
                    {t.refresh}
                </Button>
            }
            className="max-w-5xl"
            description={t.systemStatusBody}
            title={t.systemStatusTitle}
        >

            {loadState === 'loading' && !health && <AdminPageSkeleton rows={3} />}
            {error && <ErrorBanner message={error} />}

            {health && (
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatusCard label={t.web} ok value={t.up} />
                    <StatusCard label={t.api} ok={health.status === 'ok'} value={health.status} />
                    <StatusCard label={t.mongo} ok={health.mongo} value={health.mongo ? t.connected : t.error} />
                    <Card className="sm:col-span-3">
                        <p className="koda-admin-card-title">{t.systemVersion}</p>
                        <p className="mt-3 font-mono text-sm font-semibold text-[#534AB7] dark:text-brand-200">
                            {health.version}
                        </p>
                    </Card>
                </div>
            )}
        </AdminPageLayout>
    );
}

function StatusCard({ label, ok, value }: { label: string; ok?: boolean; value: string }) {
    return (
        <Card>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="koda-admin-label">{label}</p>
                    <p className="koda-admin-card-title mt-2">{value}</p>
                </div>
                <span className={`mt-1 h-3 w-3 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>
        </Card>
    );
}
