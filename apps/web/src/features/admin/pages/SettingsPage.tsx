import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { XpSettings } from '@koda/contracts';
import type { AdminOutletContext } from '../AdminLayout';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { isAdminRole } from '../hooks/useAdminAuth';
import { getXpSettings, updateXpSettings } from '@/lib/api';
import { copy } from '@/lib/i18n';
import { Card, Input } from '@/shared/ui';
import { ErrorBanner, ReadOnlyPill, SaveBar } from './RolesPage';
import { AdminPageSkeleton } from '../components/AdminSkeleton';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type FieldKey = keyof XpSettings;

const FIELDS: Array<{ key: FieldKey; labelKey: 'xpLessonComplete' | 'xpPerfectBonus' | 'xpDailyGoal'; max: number }> = [
    { key: 'lesson_complete', labelKey: 'xpLessonComplete', max: 1000 },
    { key: 'perfect_lesson_bonus', labelKey: 'xpPerfectBonus', max: 1000 },
    { key: 'daily_goal', labelKey: 'xpDailyGoal', max: 10000 },
];

export default function SettingsPage() {
    const { locale, token, user } = useOutletContext<AdminOutletContext>();
    const t = copy[locale];
    const canEdit = isAdminRole(user.role);

    const [initial, setInitial] = useState<XpSettings | null>(null);
    const [draft, setDraft] = useState<XpSettings | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saveState, setSaveState] = useState<SaveState>('idle');

    useEffect(() => {
        getXpSettings(token)
            .then(value => {
                setInitial(value);
                setDraft(value);
            })
            .catch(err => setError(err instanceof Error ? err.message : String(err)));
    }, [token]);

    const dirty = useMemo(() => JSON.stringify(initial) !== JSON.stringify(draft), [initial, draft]);

    function update(key: FieldKey, value: number) {
        if (!draft || !canEdit) return;
        setDraft({ ...draft, [key]: value });
        setSaveState('idle');
    }

    async function save() {
        if (!draft) return;
        setSaveState('saving');
        setError(null);
        try {
            const next = await updateXpSettings(token, draft);
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
            className="max-w-2xl"
            description={t.settingsBody}
            title={t.settingsTitle}
        >

            {error && <ErrorBanner message={error} />}
            {!draft && !error && <AdminPageSkeleton rows={3} />}

            {draft && (
                <Card className="space-y-4 border-[#E7E2F6]">
                    {FIELDS.map(field => (
                        <Input
                            key={field.key}
                            disabled={!canEdit}
                            label={t[field.labelKey]}
                            max={field.max}
                            min={0}
                            step={1}
                            type="number"
                            value={draft[field.key]}
                            onChange={event => update(field.key, Number(event.target.value))}
                        />
                    ))}
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
        </AdminPageLayout>
    );
}
