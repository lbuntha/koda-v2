import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { FeaturesSettings } from '@koda/contracts';
import type { AdminOutletContext } from '../AdminLayout';
import { isSuperadmin } from '../hooks/useAdminAuth';
import { getFeatureSettings, updateFeatureSettings } from '@/lib/api';
import { copy } from '@/lib/i18n';
import { Card } from '@/shared/ui';
import { ErrorBanner, ReadOnlyPill, SaveBar } from './RolesPage';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function FeaturesPage() {
    const { locale, token, user } = useOutletContext<AdminOutletContext>();
    const t = copy[locale];
    const canEdit = isSuperadmin(user.role);

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
        <section className="max-w-3xl">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-wide text-brand-600 dark:text-brand-400">
                        {t.adminConsole}
                    </p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {t.featuresTitle}
                    </h1>
                    <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">{t.featuresBody}</p>
                </div>
                {!canEdit && <ReadOnlyPill label={t.readOnly} />}
            </header>

            {error && <ErrorBanner message={error} />}

            {draft && (
                <div className="mt-6 space-y-3">
                    {draft.items.map(item => (
                        <Card key={item.key}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-base font-bold text-slate-900 dark:text-white">{item.label}</p>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                                    <p className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">
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
        </section>
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
                    ? 'bg-brand-500 dark:bg-brand-400'
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
