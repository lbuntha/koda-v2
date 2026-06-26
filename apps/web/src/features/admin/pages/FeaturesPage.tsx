import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { FeaturesSettings } from '@koda/contracts';
import type { AdminOutletContext } from '../AdminLayout';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { isAdminRole } from '../hooks/useAdminAuth';
import { getFeatureSettings, updateFeatureSettings } from '@/lib/api';
import { copy } from '@/lib/i18n';
import { Card } from '@/shared/ui';
import { ErrorBanner, ReadOnlyPill, SaveBar } from './RolesPage';
import { AdminPageSkeleton } from '../components/AdminSkeleton';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function FeaturesPage() {
    const { locale, token, user } = useOutletContext<AdminOutletContext>();
    const t = copy[locale];
    const canEdit = isAdminRole(user.role);

    const [initial, setInitial] = useState<FeaturesSettings | null>(null);
    const [draft, setDraft] = useState<FeaturesSettings | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saveState, setSaveState] = useState<SaveState>('idle');

    useEffect(() => {
        getFeatureSettings(token)
            .then(value => {
                setInitial(value);
                setDraft(value);
            })
            .catch(err => setError(err instanceof Error ? err.message : String(err)));
    }, [token]);

    const dirty = useMemo(() => JSON.stringify(initial) !== JSON.stringify(draft), [initial, draft]);

    function toggle(key: string) {
        if (!draft || !canEdit) return;
        setDraft({
            ...draft,
            items: draft.items.map(item => (item.key === key ? { ...item, enabled: !item.enabled } : item)),
        });
        setSaveState('idle');
    }

    async function save() {
        if (!draft) return;
        setSaveState('saving');
        setError(null);
        try {
            const next = await updateFeatureSettings(token, draft);
            setInitial(next);
            setDraft(next);
            setSaveState('saved');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setSaveState('error');
        }
    }

    return (
        <AdminPageLayout
            actions={!canEdit && <ReadOnlyPill label={t.readOnly} />}
            className="max-w-3xl"
            description={t.featuresBody}
            title={t.featuresTitle}
        >

            {error && <ErrorBanner message={error} />}
            {!draft && !error && <AdminPageSkeleton rows={4} />}

            {draft && (
                <div className="space-y-3">
                    {draft.items.map(item => (
                        <Card key={item.key} className="border-[#E7E2F6]">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="koda-admin-card-title">{item.label}</p>
                                    <p className="koda-admin-label mt-1">{item.description}</p>
                                    <p className="mt-1 font-mono text-[11px] text-[#8D89AE] dark:text-slate-500">
                                        {item.key}
                                    </p>
                                </div>
                                <Toggle
                                    ariaLabel={item.label}
                                    disabled={!canEdit}
                                    enabled={item.enabled}
                                    onChange={() => toggle(item.key)}
                                />
                            </div>
                        </Card>
                    ))}
                </div>
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
        </AdminPageLayout>
    );
}

function Toggle({
    ariaLabel,
    disabled,
    enabled,
    onChange,
}: {
    ariaLabel: string;
    disabled: boolean;
    enabled: boolean;
    onChange: () => void;
}) {
    return (
        <button
            aria-label={ariaLabel}
            aria-pressed={enabled}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
                enabled
                    ? 'bg-[#534AB7] dark:bg-brand-400'
                    : 'bg-slate-300 dark:bg-slate-700'
            }`}
            disabled={disabled}
            type="button"
            onClick={onChange}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
}
