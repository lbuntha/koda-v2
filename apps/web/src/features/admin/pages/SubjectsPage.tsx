import { useEffect, useMemo, useState } from 'react';
import type { AgeRangeItem, LearningCatalogSettings, SubjectItem } from '@koda/contracts';
import { useOutletContext } from 'react-router-dom';
import type { AdminOutletContext } from '../AdminLayout';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { AdminPageSkeleton } from '../components/AdminSkeleton';
import { isAdminRole } from '../hooks/useAdminAuth';
import { ErrorBanner, ReadOnlyPill, SaveBar } from './RolesPage';
import { getLearningCatalog, updateLearningCatalog } from '@/lib/api';
import { copy } from '@/lib/i18n';
import { Button, Card, ConfirmDialog, DataTable, Input, Tabs, type DataTableColumn } from '@/shared/ui';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type CatalogTab = 'grades' | 'subjects';
const COLOR_SWATCHES = ['#DDE7FF', '#CFF9DF', '#FFF1BA', '#FFE1E7', '#DFF2FF', '#EFE2FF', '#FFEACF', '#C9F7EC', '#FBE0F1'];
const CATEGORIES = ['Early', 'Elementary', 'Middle'];
const UI_STYLES = [
    'Discover (simple home, ages 5-6)',
    'Explore (guided classroom, ages 7-8)',
    'Build (projects and practice, ages 8-9)',
    'Quest (challenge path, ages 9-10)',
];

export default function SubjectsPage() {
    const { locale, token, user } = useOutletContext<AdminOutletContext>();
    const t = copy[locale];
    const canEdit = isAdminRole(user.role);
    const [initial, setInitial] = useState<LearningCatalogSettings | null>(null);
    const [draft, setDraft] = useState<LearningCatalogSettings | null>(null);
    const [selectedRangeId, setSelectedRangeId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [activeTab, setActiveTab] = useState<CatalogTab>('grades');

    useEffect(() => {
        getLearningCatalog(token)
            .then(value => {
                setInitial(value);
                setDraft(value);
                setSelectedRangeId(value.age_ranges[0]?.id ?? null);
            })
            .catch(err => setError(err instanceof Error ? err.message : String(err)));
    }, [token]);

    const dirty = useMemo(() => JSON.stringify(initial) !== JSON.stringify(draft), [draft, initial]);

    function setCatalog(next: LearningCatalogSettings) {
        setDraft(next);
        setSaveState('idle');
    }

    async function save() {
        if (!draft) return;
        setSaveState('saving');
        setError(null);
        try {
            const next = await updateLearningCatalog(token, draft);
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
            className="max-w-6xl"
            description={t.subjectsBody}
            title={t.subjectsTitle}
        >
            {error && <ErrorBanner message={error} />}
            {!draft && !error && <AdminPageSkeleton rows={4} />}
            {draft && (
                <div>
                    <Tabs
                        ariaLabel={t.subjectsTitle}
                        items={[
                            { value: 'grades', label: t.gradeCustomization, badge: draft.age_ranges.length },
                            { value: 'subjects', label: t.subjects, badge: draft.subjects.length },
                        ]}
                        value={activeTab}
                        onChange={setActiveTab}
                    />
                    <div className="mt-4">
                        {activeTab === 'grades' ? (
                            <GradeCustomization
                                canEdit={canEdit}
                                catalog={draft}
                                selectedRangeId={selectedRangeId}
                                t={t}
                                onChange={setCatalog}
                                onSelect={setSelectedRangeId}
                            />
                        ) : (
                            <SubjectsPanel canEdit={canEdit} catalog={draft} t={t} onChange={setCatalog} />
                        )}
                    </div>
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

function GradeCustomization({
    canEdit,
    catalog,
    selectedRangeId,
    t,
    onChange,
    onSelect,
}: {
    canEdit: boolean;
    catalog: LearningCatalogSettings;
    selectedRangeId: string | null;
    t: (typeof copy)['en'];
    onChange: (next: LearningCatalogSettings) => void;
    onSelect: (id: string) => void;
}) {
    const selected = catalog.age_ranges.find(range => range.id === selectedRangeId) ?? catalog.age_ranges[0] ?? null;
    const [minAge, setMinAge] = useState('5');
    const [maxAge, setMaxAge] = useState('6');

    function addAgeRange() {
        const min = Number(minAge);
        const max = Number(maxAge);
        if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return;
        const id = `age-${min}-${max}`;
        if (catalog.age_ranges.some(range => range.id === id)) return;
        const nextRange: AgeRangeItem = {
            id,
            label: `Age ${min}-${max}`,
            short_label: `${min}-${max}`,
            category: 'Elementary',
            ui_style: UI_STYLES[0],
            description: '',
            color: COLOR_SWATCHES[1],
            min_age: min,
            max_age: max,
            subject_ids: [],
            enabled: true,
        };
        onChange({ ...catalog, age_ranges: [...catalog.age_ranges, nextRange] });
        onSelect(id);
    }

    function updateRange(id: string, patch: Partial<AgeRangeItem>) {
        onChange({
            ...catalog,
            age_ranges: catalog.age_ranges.map(range => range.id === id ? { ...range, ...patch } : range),
        });
    }

    function toggleSubject(range: AgeRangeItem, subjectId: string) {
        const has = range.subject_ids.includes(subjectId);
        updateRange(range.id, {
            subject_ids: has ? range.subject_ids.filter(id => id !== subjectId) : [...range.subject_ids, subjectId],
        });
    }

    return (
        <Card className="border-[#E7E2F6]">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="koda-admin-section-title">{t.gradeCustomization}</h2>
                    <p className="koda-admin-label mt-1">{t.gradeCustomizationBody}</p>
                </div>
                {canEdit && (
                    <div className="flex items-end gap-2">
                        <Input className="w-24" label={t.minAge} min={0} max={18} type="number" value={minAge} onChange={event => setMinAge(event.target.value)} />
                        <Input className="w-24" label={t.maxAge} min={0} max={18} type="number" value={maxAge} onChange={event => setMaxAge(event.target.value)} />
                        <Button onClick={addAgeRange}>{t.addAgeRange}</Button>
                    </div>
                )}
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    {catalog.age_ranges.map((range, index) => {
                        const active = selected?.id === range.id;
                        return (
                            <button
                                key={range.id}
                                className={`overflow-hidden rounded-2xl border text-left shadow-sm transition ${
                                    active ? 'border-[#10b981] ring-2 ring-emerald-100' : 'border-[#E7E2F6] hover:border-[#BDB4F4]'
                                }`}
                                type="button"
                                onClick={() => onSelect(range.id)}
                            >
                                <div className="flex items-center gap-4 px-5 py-4" style={{ backgroundColor: range.color || '#CFF9DF' }}>
                                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/80 text-xl font-semibold text-[#0E0B55] shadow-sm">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="text-lg font-semibold text-[#0E0B55]">{range.label}</p>
                                        <p className="text-sm font-semibold text-[#6D6997]">{range.category || '-'}</p>
                                    </div>
                                </div>
                                <div className="min-h-20 bg-white px-5 py-3 dark:bg-slate-900">
                                    <p className="text-sm font-medium text-[#6D6997]">{range.description || t.notSet}</p>
                                    <p className="mt-2 text-xs font-semibold text-[#8D89AE]">
                                        {range.subject_ids.length} {t.assignedSubjects}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {selected && (
                    <div className="rounded-2xl border border-[#E7E2F6] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input required disabled={!canEdit} label={t.fullLabel} value={selected.label} onChange={event => updateRange(selected.id, { label: event.target.value })} />
                            <Input required disabled={!canEdit} label={t.shortLabel} value={selected.short_label ?? ''} onChange={event => updateRange(selected.id, { short_label: event.target.value })} />
                            <label className="block sm:col-span-2">
                                <span className="text-xs font-semibold uppercase text-[#6D6997]">
                                    {t.category}
                                    <span className="ml-1 text-rose-500">*</span>
                                </span>
                                <select
                                    className="mt-1 min-h-12 w-full rounded-xl border border-[#DCD7EA] bg-white px-4 text-sm font-medium text-[#0E0B55] outline-none focus:border-[#534AB7] focus:ring-4 focus:ring-[#E8E3FF] disabled:cursor-not-allowed disabled:bg-slate-50"
                                    disabled={!canEdit}
                                    value={selected.category ?? ''}
                                    onChange={event => updateRange(selected.id, { category: event.target.value })}
                                >
                                    {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                                </select>
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="text-xs font-semibold uppercase text-[#6D6997]">
                                    {t.gameUiStyle}
                                    <span className="ml-1 text-rose-500">*</span>
                                </span>
                                <select
                                    className="mt-1 min-h-12 w-full rounded-xl border border-[#DCD7EA] bg-white px-4 text-sm font-medium text-[#0E0B55] outline-none focus:border-[#534AB7] focus:ring-4 focus:ring-[#E8E3FF] disabled:cursor-not-allowed disabled:bg-slate-50"
                                    disabled={!canEdit}
                                    value={selected.ui_style ?? ''}
                                    onChange={event => updateRange(selected.id, { ui_style: event.target.value })}
                                >
                                    {UI_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                                </select>
                            </label>
                            <label className="block sm:col-span-2">
                                <span className="text-xs font-semibold uppercase text-[#6D6997]">{t.subjectDescription}</span>
                                <textarea
                                    className="mt-1 min-h-20 w-full rounded-xl border border-[#DCD7EA] bg-white px-4 py-3 text-sm font-medium text-[#0E0B55] outline-none focus:border-[#534AB7] focus:ring-4 focus:ring-[#E8E3FF] disabled:cursor-not-allowed disabled:bg-slate-50"
                                    disabled={!canEdit}
                                    value={selected.description ?? ''}
                                    onChange={event => updateRange(selected.id, { description: event.target.value })}
                                />
                            </label>
                        </div>

                        <div className="mt-4">
                            <p className="text-xs font-semibold uppercase text-[#6D6997]">{t.color}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {COLOR_SWATCHES.map(color => (
                                    <button
                                        key={color}
                                        aria-label={color}
                                        className={`h-9 w-9 rounded-xl border-2 ${selected.color === color ? 'border-emerald-500' : 'border-transparent'}`}
                                        disabled={!canEdit}
                                        style={{ backgroundColor: color }}
                                        type="button"
                                        onClick={() => updateRange(selected.id, { color })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className="text-xs font-semibold uppercase text-[#6D6997]">{t.assignedSubjects}</p>
                            <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-[#E7E2F6] bg-[#FBFAFF] p-3">
                                {catalog.subjects.map(subject => (
                                    <label key={subject.id} className="inline-flex items-center gap-2 rounded-xl border border-[#E7E2F6] bg-white px-3 py-2 text-sm font-semibold text-[#6D6997]">
                                        <input
                                            checked={selected.subject_ids.includes(subject.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 disabled:cursor-not-allowed"
                                            disabled={!canEdit || !subject.enabled}
                                            type="checkbox"
                                            onChange={() => toggleSubject(selected, subject.id)}
                                        />
                                        {subject.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

function SubjectsPanel({
    canEdit,
    catalog,
    t,
    onChange,
}: {
    canEdit: boolean;
    catalog: LearningCatalogSettings;
    t: (typeof copy)['en'];
    onChange: (next: LearningCatalogSettings) => void;
}) {
    const [id, setId] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SubjectItem | null>(null);

    const editing = editingId ? catalog.subjects.find(subject => subject.id === editingId) ?? null : null;

    function submitSubject() {
        const subjectId = slugify(id || label);
        if (!subjectId || !label.trim()) return;
        if (!editing && catalog.subjects.some(subject => subject.id === subjectId)) return;
        if (editing) {
            updateSubject(editing.id, { label: label.trim(), description: description.trim() });
            resetForm();
            return;
        }
        onChange({
            ...catalog,
            subjects: [...catalog.subjects, { id: subjectId, label: label.trim(), description: description.trim(), enabled: true }],
        });
        resetForm();
    }

    function resetForm() {
        setId('');
        setLabel('');
        setDescription('');
        setEditingId(null);
    }

    function updateSubject(id: string, patch: Partial<SubjectItem>) {
        onChange({
            ...catalog,
            subjects: catalog.subjects.map(subject => subject.id === id ? { ...subject, ...patch } : subject),
        });
    }

    function editSubject(subject: SubjectItem) {
        setEditingId(subject.id);
        setId(subject.id);
        setLabel(subject.label);
        setDescription(subject.description);
    }

    function deleteSubject(subjectId: string) {
        onChange({
            ...catalog,
            subjects: catalog.subjects.filter(subject => subject.id !== subjectId),
            age_ranges: catalog.age_ranges.map(range => ({
                ...range,
                subject_ids: range.subject_ids.filter(id => id !== subjectId),
            })),
        });
        if (editingId === subjectId) resetForm();
    }

    const columns: Array<DataTableColumn<SubjectItem>> = [
        {
            key: 'subject',
            label: t.subject,
            render: subject => (
                <div>
                    <p className="font-semibold text-[#0E0B55] dark:text-white">{subject.label}</p>
                    <p className="font-mono text-xs text-[#8D89AE]">{subject.id}</p>
                </div>
            ),
        },
        {
            key: 'description',
            label: t.subjectDescription,
            render: subject => <p className="max-w-sm text-sm text-[#6D6997]">{subject.description || '-'}</p>,
        },
        {
            key: 'enabled',
            label: t.menuEnabled,
            render: subject => (
                <input
                    checked={subject.enabled}
                    className="h-5 w-5 rounded border-slate-300 text-brand-500 focus:ring-brand-500 disabled:cursor-not-allowed"
                    disabled={!canEdit}
                    type="checkbox"
                    onChange={event => updateSubject(subject.id, { enabled: event.target.checked })}
                />
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'text-right',
            render: subject => canEdit ? (
                <div className="flex justify-end gap-3">
                    <button
                        className="text-sm font-semibold text-[#534AB7] hover:underline dark:text-brand-300"
                        type="button"
                        onClick={() => editSubject(subject)}
                    >
                        Edit
                    </button>
                    <button
                        className="text-sm font-semibold text-rose-600 hover:underline dark:text-rose-400"
                        type="button"
                        onClick={() => setDeleteTarget(subject)}
                    >
                        Remove
                    </button>
                </div>
            ) : null,
        },
    ];

    return (
        <Card className="border-[#E7E2F6]" padded={false}>
            <div className="border-b border-[#EEEAF9] p-4">
                <h2 className="koda-admin-section-title">{t.subjects}</h2>
                {canEdit && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Input required label={t.subjectName} value={label} onChange={event => setLabel(event.target.value)} />
                        <Input disabled={Boolean(editing)} label={t.subjectId} value={id} onChange={event => setId(event.target.value)} />
                        <Input className="sm:col-span-2" label={t.subjectDescription} value={description} onChange={event => setDescription(event.target.value)} />
                        <div className="flex gap-2 sm:col-span-2">
                            {editing && (
                                <Button className="flex-1" variant="outline" onClick={resetForm}>
                                    {t.cancel}
                                </Button>
                            )}
                            <Button className="flex-1" disabled={!label.trim()} onClick={submitSubject}>
                                {editing ? t.save : t.addSubject}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <DataTable columns={columns} empty="No subjects yet." rows={catalog.subjects} rowKey={subject => subject.id} />
            <ConfirmDialog
                destructive
                body={
                    <>
                        Delete <span className="font-semibold text-[#0E0B55]">{deleteTarget?.label}</span>? It will be removed from every age range.
                    </>
                }
                confirmLabel="Delete"
                open={Boolean(deleteTarget)}
                title="Delete subject"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget) deleteSubject(deleteTarget.id);
                    setDeleteTarget(null);
                }}
            />
        </Card>
    );
}

function slugify(value: string) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
