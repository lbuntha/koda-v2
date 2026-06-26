import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Bell, Camera, Download, LockKeyhole, Mail, ShieldCheck, UserRound, Users } from 'lucide-react';
import type { ParentNotificationPreferences, ParentProfile } from '@koda/contracts';
import type { ParentOutletContext } from '../ParentLayout';
import { useOutletContext } from 'react-router-dom';
import { getParentProfile, updateParentProfile, uploadParentAvatar } from '@/lib/api';
import { AdminPageLayout } from '@/features/admin/components/AdminPageLayout';
import { AvatarCollectionPicker, Button, Card, Input } from '@/shared/ui';

const DEFAULT_NOTIFICATIONS: ParentNotificationPreferences = {
    placement_complete: true,
    weekly_summary: true,
    learning_reminders: true,
    product_updates: false,
};

const TIMEZONES = ['Asia/Phnom_Penh', 'Asia/Bangkok', 'Asia/Singapore', 'UTC'];

export default function ParentSettingsPage() {
    const { token } = useOutletContext<ParentOutletContext>();
    const [form, setForm] = useState<ParentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setLoading(true);
        getParentProfile(token)
            .then(data => {
                setForm(data);
                setError(null);
            })
            .catch(err => setError(err instanceof Error ? err.message : String(err)))
            .finally(() => setLoading(false));
    }, [token]);

    const initials = useMemo(() => getInitials(form?.display_name || form?.email || 'P'), [form]);

    async function save(event: FormEvent) {
        event.preventDefault();
        if (!form) return;
        setSaving(true);
        setSaved(false);
        setError(null);
        try {
            const updated = await updateParentProfile(token, {
                display_name: form.display_name,
                locale: form.locale,
                avatar_url: form.avatar_url,
                avatar_svg: form.avatar_svg,
                phone: form.phone,
                timezone: form.timezone,
                notification_preferences: form.notification_preferences,
            });
            setForm(updated);
            setSaved(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setSaving(false);
        }
    }

    async function uploadAvatar(file: File | null) {
        if (!file || !form) return;
        setUploading(true);
        setError(null);
        try {
            const asset = await uploadParentAvatar(token, file);
            setForm({
                ...form,
                avatar_url: asset.url,
                avatar_svg: asset.kind === 'svg' ? asset.svg ?? null : null,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setUploading(false);
        }
    }

    function updateNotification(key: keyof ParentNotificationPreferences, value: boolean) {
        setForm(current => current && {
            ...current,
            notification_preferences: {
                ...DEFAULT_NOTIFICATIONS,
                ...current.notification_preferences,
                [key]: value,
            },
        });
    }

    return (
        <AdminPageLayout
            className="max-w-6xl"
            description="Update your family profile, photo, language, and notifications."
            title="Settings"
        >
            {error && (
                <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    {error}
                </p>
            )}
            {saved && (
                <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Settings saved.
                </p>
            )}

            {loading || !form ? (
                <SettingsSkeleton />
            ) : (
                <form className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]" onSubmit={save}>
                    <div className="space-y-5">
                        <Card className="border-[#E7E2F6] dark:border-slate-800">
                            <div className="flex items-start gap-3">
                                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F2EEFF] text-[#534AB7] dark:bg-slate-800 dark:text-brand-300">
                                    <UserRound className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2 className="koda-admin-section-title">Profile</h2>
                                    <p className="koda-admin-label mt-1">This is the parent profile shown in the profile switcher.</p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <Input
                                    required
                                    label="Display name"
                                    value={form.display_name}
                                    onChange={event => setForm({ ...form, display_name: event.target.value })}
                                />
                                <Input disabled label="Email" value={form.email} />
                                <Input
                                    label="Phone"
                                    placeholder="+855..."
                                    value={form.phone ?? ''}
                                    onChange={event => setForm({ ...form, phone: event.target.value })}
                                />
                                <label className="block">
                                    <span className="text-xs font-semibold uppercase text-[#6D6997] dark:text-slate-400">Language</span>
                                    <select
                                        className="mt-1 min-h-10 w-full rounded-xl border border-[#DCD7EA] bg-white px-3 text-sm font-medium text-[#0E0B55] outline-none focus:border-[#534AB7] focus:ring-4 focus:ring-[#E8E3FF] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                        value={form.locale}
                                        onChange={event => setForm({ ...form, locale: event.target.value })}
                                    >
                                        <option value="en">English</option>
                                        <option value="km">Khmer</option>
                                    </select>
                                </label>
                                <label className="block sm:col-span-2">
                                    <span className="text-xs font-semibold uppercase text-[#6D6997] dark:text-slate-400">Timezone</span>
                                    <select
                                        className="mt-1 min-h-10 w-full rounded-xl border border-[#DCD7EA] bg-white px-3 text-sm font-medium text-[#0E0B55] outline-none focus:border-[#534AB7] focus:ring-4 focus:ring-[#E8E3FF] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                        value={form.timezone}
                                        onChange={event => setForm({ ...form, timezone: event.target.value })}
                                    >
                                        {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                    </select>
                                </label>
                            </div>
                        </Card>

                        <Card className="border-[#E7E2F6] dark:border-slate-800">
                            <div className="flex items-start gap-3">
                                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F2EEFF] text-[#534AB7] dark:bg-slate-800 dark:text-brand-300">
                                    <Bell className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2 className="koda-admin-section-title">Notifications</h2>
                                    <p className="koda-admin-label mt-1">Choose what Koda should send to you.</p>
                                </div>
                            </div>
                            <div className="mt-5 grid gap-3">
                                <NotificationToggle
                                    checked={form.notification_preferences.placement_complete}
                                    description="Tell me when a kid finishes placement."
                                    label="Placement complete"
                                    onChange={value => updateNotification('placement_complete', value)}
                                />
                                <NotificationToggle
                                    checked={form.notification_preferences.weekly_summary}
                                    description="Send a weekly snapshot of progress."
                                    label="Weekly summary"
                                    onChange={value => updateNotification('weekly_summary', value)}
                                />
                                <NotificationToggle
                                    checked={form.notification_preferences.learning_reminders}
                                    description="Remind me when kids have not practiced recently."
                                    label="Learning reminders"
                                    onChange={value => updateNotification('learning_reminders', value)}
                                />
                                <NotificationToggle
                                    checked={form.notification_preferences.product_updates}
                                    description="Occasional updates about new Koda features."
                                    label="Product updates"
                                    onChange={value => updateNotification('product_updates', value)}
                                />
                            </div>
                        </Card>
                    </div>

                    <aside className="space-y-5">
                        <Card className="border-[#E7E2F6] dark:border-slate-800">
                            <div className="flex items-start gap-3">
                                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#F2EEFF] text-[#534AB7] dark:bg-slate-800 dark:text-brand-300">
                                    <Camera className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2 className="koda-admin-section-title">Photo</h2>
                                    <p className="koda-admin-label mt-1">Choose an avatar or upload an image.</p>
                                </div>
                            </div>
                            <div className="mt-5 space-y-4">
                                <AvatarPreview
                                    displayName={form.display_name}
                                    initials={initials}
                                    svg={form.avatar_svg}
                                    url={form.avatar_url}
                                />
                                <label className="block">
                                    <span className="text-xs font-semibold uppercase text-[#6D6997] dark:text-slate-400">Upload image or SVG</span>
                                    <input
                                        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                                        className="mt-1 block w-full text-sm font-medium text-[#6D6997] file:mr-3 file:min-h-10 file:rounded-xl file:border-0 file:bg-[#F2EEFF] file:px-3 file:text-sm file:font-semibold file:text-[#534AB7] dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-brand-300"
                                        disabled={uploading}
                                        type="file"
                                        onChange={event => void uploadAvatar(event.target.files?.[0] ?? null)}
                                    />
                                </label>
                                {uploading && (
                                    <p className="text-sm font-semibold text-[#6D6997] dark:text-slate-300">Uploading avatar...</p>
                                )}
                                <AvatarCollectionPicker
                                    seedHints={[form.display_name, form.email]}
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

                        <Card className="border-[#E7E2F6] dark:border-slate-800">
                            <h2 className="koda-admin-section-title">Suggested next</h2>
                            <div className="mt-4 space-y-3">
                                <Suggestion icon={Users} title="Connected caregivers" body="Invite another parent or guardian." />
                                <Suggestion icon={ShieldCheck} title="Privacy controls" body="Export or delete family learning data." />
                                <Suggestion icon={LockKeyhole} title="Kid access rules" body="Set quiet hours and allowed days." />
                                <Suggestion icon={Download} title="Reports" body="Download weekly progress summaries." />
                                <Suggestion icon={Mail} title="Email routing" body="Choose who receives learning updates." />
                            </div>
                        </Card>

                        <Button className="w-full" loading={saving} loadingText="Saving..." type="submit">
                            Save settings
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
        return (
            <img
                alt={displayName}
                className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-[#F2EEFF] dark:ring-slate-800"
                src={url}
            />
        );
    }
    return (
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[#7C6DD8] to-[#534AB7] text-3xl font-semibold text-white">
            {initials}
        </div>
    );
}

function NotificationToggle({
    checked,
    description,
    label,
    onChange,
}: {
    checked: boolean;
    description: string;
    label: string;
    onChange: (value: boolean) => void;
}) {
    return (
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-[#EEEAF9] bg-[#FBFAFF] px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <span>
                <span className="block text-sm font-semibold text-[#0E0B55] dark:text-white">{label}</span>
                <span className="mt-1 block text-xs font-medium text-[#6D6997] dark:text-slate-400">{description}</span>
            </span>
            <input
                checked={checked}
                className="h-5 w-5 rounded border-[#A7A2B8] text-[#534AB7] focus:ring-[#BDB4F4]"
                type="checkbox"
                onChange={event => onChange(event.target.checked)}
            />
        </label>
    );
}

function Suggestion({ body, icon: Icon, title }: { body: string; icon: typeof Users; title: string }) {
    return (
        <div className="flex gap-3 rounded-2xl border border-[#EEEAF9] bg-[#FBFAFF] p-3 dark:border-slate-800 dark:bg-slate-950">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#534AB7] dark:bg-slate-900 dark:text-brand-300">
                <Icon className="h-4 w-4" />
            </span>
            <span>
                <span className="block text-sm font-semibold text-[#0E0B55] dark:text-white">{title}</span>
                <span className="mt-1 block text-xs font-medium text-[#6D6997] dark:text-slate-400">{body}</span>
            </span>
        </div>
    );
}

function SettingsSkeleton() {
    return (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
                <div className="h-72 rounded-3xl bg-white dark:bg-slate-900" />
                <div className="h-80 rounded-3xl bg-white dark:bg-slate-900" />
            </div>
            <div className="h-96 rounded-3xl bg-white dark:bg-slate-900" />
        </div>
    );
}

function getInitials(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'P';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
