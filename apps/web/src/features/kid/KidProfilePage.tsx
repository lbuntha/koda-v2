import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Camera, UserRound } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { ChildProfile } from '@koda/contracts';
import { getKidProfile, updateKidProfile, uploadChildAvatar } from '@/lib/api';
import { AdminPageLayout } from '@/features/admin/components/AdminPageLayout';
import { AvatarCollectionPicker, Button, Card, Input } from '@/shared/ui';
import type { KidOutletContext } from './KidLayout';

export default function KidProfilePage() {
    const { child, childToken, updateChild } = useOutletContext<KidOutletContext>();
    const [form, setForm] = useState<ChildProfile>(child);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const initials = useMemo(() => getInitials(form.display_name), [form.display_name]);

    useEffect(() => {
        setLoading(true);
        getKidProfile(childToken)
            .then(profile => {
                setForm(profile);
                updateChild(profile);
                setError(null);
            })
            .catch(err => setError(err instanceof Error ? err.message : String(err)))
            .finally(() => setLoading(false));
    }, [childToken, updateChild]);

    async function save(event: FormEvent) {
        event.preventDefault();
        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            const updated = await updateKidProfile(childToken, {
                display_name: form.display_name,
                avatar_url: form.avatar_url,
                avatar_svg: form.avatar_svg,
                locale: form.locale,
            });
            setForm(updated);
            updateChild(updated);
            setSaved(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setSaving(false);
        }
    }

    async function uploadAvatar(file: File | null) {
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const asset = await uploadChildAvatar(childToken, file);
            setForm(current => ({
                ...current,
                avatar_url: asset.url,
                avatar_svg: asset.kind === 'svg' ? asset.svg ?? null : null,
            }));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setUploading(false);
        }
    }

    return (
        <AdminPageLayout
            className="max-w-5xl"
            description="Update your name, language, and avatar."
            title="Profile"
        >
            {error && (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    {error}
                </p>
            )}
            {saved && (
                <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Profile saved.
                </p>
            )}

            {loading ? (
                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="h-64 rounded-3xl border border-[#E7E2F6] bg-white dark:border-slate-800 dark:bg-slate-900" />
                    <div className="h-96 rounded-3xl border border-[#E7E2F6] bg-white dark:border-slate-800 dark:bg-slate-900" />
                </div>
            ) : (
                <form className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]" onSubmit={save}>
                    <Card className="border-[#E7E2F6] dark:border-slate-800">
                        <div className="flex items-start gap-3">
                            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F2EEFF] text-[#534AB7] dark:bg-brand-400/15 dark:text-brand-200">
                                <UserRound className="h-5 w-5" />
                            </span>
                            <div>
                                <h2 className="koda-admin-section-title">About me</h2>
                                <p className="koda-admin-label mt-1">This is the profile shown when you switch profiles.</p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <Input
                                required
                                label="Display name"
                                value={form.display_name}
                                onChange={event => setForm({ ...form, display_name: event.target.value })}
                            />
                            <label className="block">
                                <span className="text-xs font-semibold uppercase text-[#6D6997] dark:text-slate-400">Language</span>
                                <select
                                    className="mt-1 min-h-10 w-full rounded-xl border border-[#DCD7EA] bg-white px-3 text-sm font-medium text-[#0E0B55] outline-none focus:border-[#534AB7] focus:ring-4 focus:ring-[#E8E3FF] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-brand-400 dark:focus:ring-slate-800"
                                    value={form.locale}
                                    onChange={event => setForm({ ...form, locale: event.target.value })}
                                >
                                    <option value="en">English</option>
                                    <option value="km">Khmer</option>
                                </select>
                            </label>
                            <Input disabled label="Age range" value={form.age_range_id ?? '-'} />
                            <Input disabled label="Placement" value={formatPlacement(form.placement_status)} />
                        </div>
                    </Card>

                    <aside className="space-y-5">
                        <Card className="border-[#E7E2F6] dark:border-slate-800">
                            <div className="flex items-start gap-3">
                                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F2EEFF] text-[#534AB7] dark:bg-brand-400/15 dark:text-brand-200">
                                    <Camera className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2 className="koda-admin-section-title">Avatar</h2>
                                    <p className="koda-admin-label mt-1">Choose an avatar or upload an image.</p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
                                <AvatarPreview displayName={form.display_name} initials={initials} svg={form.avatar_svg} url={form.avatar_url} />
                                <label className="block">
                                    <span className="text-xs font-semibold uppercase text-[#6D6997] dark:text-slate-400">Upload image or SVG</span>
                                    <input
                                        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                                        className="mt-1 block w-full rounded-xl border border-transparent text-sm font-medium text-[#6D6997] file:mr-3 file:min-h-10 file:rounded-xl file:border-0 file:bg-[#F2EEFF] file:px-3 file:text-sm file:font-semibold file:text-[#534AB7] dark:border-slate-800 dark:bg-slate-950 dark:p-2 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-brand-200"
                                        disabled={uploading}
                                        type="file"
                                        onChange={event => void uploadAvatar(event.target.files?.[0] ?? null)}
                                    />
                                </label>
                                {uploading && <p className="text-sm font-semibold text-[#6D6997] dark:text-slate-300">Uploading avatar...</p>}
                                <AvatarCollectionPicker
                                    seedHints={[form.display_name]}
                                    value={form.avatar_url}
                                    onError={setError}
                                    onChange={selection => setForm({
                                        ...form,
                                        avatar_url: selection.url,
                                        avatar_svg: selection.svg,
                                    })}
                                />
                            </div>
                        </Card>

                        <Button className="w-full" loading={saving} loadingText="Saving..." type="submit">
                            Save profile
                        </Button>
                    </aside>
                </form>
            )}
        </AdminPageLayout>
    );
}

function AvatarPreview({
    displayName,
    initials,
    svg,
    url,
}: {
    displayName: string;
    initials: string;
    svg?: string | null;
    url?: string | null;
}) {
    if (svg) {
        return (
            <div
                aria-label={`${displayName} avatar`}
                className="mx-auto h-24 w-24 overflow-hidden rounded-full ring-4 ring-[#F2EEFF] dark:ring-slate-800"
                dangerouslySetInnerHTML={{ __html: svg }}
                role="img"
            />
        );
    }
    if (url) {
        return <img alt={displayName} className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-[#F2EEFF] dark:ring-slate-800" src={url} />;
    }
    return (
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#7C6DD8] to-[#534AB7] text-3xl font-semibold text-white">
            {initials}
        </div>
    );
}

function formatPlacement(value: ChildProfile['placement_status']) {
    if (value === 'complete') return 'Complete';
    if (value === 'in_progress') return 'In progress';
    return 'Not started';
}

function getInitials(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'K';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
