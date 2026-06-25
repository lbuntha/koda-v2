import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Role, RolesSettings, UserPublic } from '@koda/contracts';
import {
    clearTokens,
    getHealth,
    getMe,
    getRoleSettings,
    getStoredToken,
    login,
    register,
    storeTokens,
    type Health,
} from '@/lib/api';
import { copy, type Locale } from '@/lib/i18n';

type AuthMode = 'login' | 'register';

interface FormState {
    email: string;
    password: string;
    displayName: string;
}

const emptyForm: FormState = {
    email: '',
    password: '',
    displayName: '',
};

export default function App() {
    const [locale, setLocale] = useState<Locale>('en');
    const t = copy[locale];
    const [mode, setMode] = useState<AuthMode>('login');
    const [form, setForm] = useState<FormState>(emptyForm);
    const [health, setHealth] = useState<Health | null>(null);
    const [healthError, setHealthError] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [user, setUser] = useState<UserPublic | null>(null);
    const [rolesSettings, setRolesSettings] = useState<RolesSettings | null>(null);
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        getHealth()
            .then(setHealth)
            .catch(error => setHealthError(String(error instanceof Error ? error.message : error)));
    }, []);

    useEffect(() => {
        const token = getStoredToken();
        if (!token) {
            return;
        }
        getMe(token)
            .then(setUser)
            .catch(() => clearTokens());
    }, []);

    useEffect(() => {
        const token = getStoredToken();
        if (!token || !user || !canViewAdmin(user.role)) {
            setRolesSettings(null);
            return;
        }
        getRoleSettings(token)
            .then(settings => {
                setRolesSettings(settings);
                setSettingsError(null);
            })
            .catch(error => setSettingsError(error instanceof Error ? error.message : String(error)));
    }, [user]);

    const modeCopy = useMemo(
        () => ({
            title: mode === 'login' ? t.signIn : t.createAccount,
            submit: mode === 'login' ? t.submitSignIn : t.submitCreate,
        }),
        [mode, t],
    );

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setAuthError(null);

        try {
            const tokens =
                mode === 'login'
                    ? await login(form.email, form.password)
                    : await register({
                          email: form.email,
                          password: form.password,
                          display_name: form.displayName,
                          locale,
                      });
            storeTokens(tokens);
            setUser(tokens.user);
            setForm(emptyForm);
        } catch (error) {
            setAuthError(error instanceof Error ? error.message : String(error));
        } finally {
            setBusy(false);
        }
    }

    function signOut() {
        clearTokens();
        setUser(null);
        setRolesSettings(null);
        setAuthError(null);
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-300">
            <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-8 lg:px-10">
                <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-600 text-lg font-black text-white shadow-sm">
                            K
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight sm:text-2xl">{t.appName}</h1>
                            <p className="text-sm font-medium text-slate-500">{t.milestone}</p>
                        </div>
                    </div>
                    <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                        {(['en', 'km'] satisfies Locale[]).map(option => (
                            <button
                                key={option}
                                className={`min-h-11 rounded-xl px-4 text-sm font-bold transition ${
                                    locale === option
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                                type="button"
                                onClick={() => setLocale(option)}
                            >
                                {option.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </header>

                <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:py-12">
                    <div className="max-w-2xl">
                        <p className="mb-3 text-sm font-black uppercase text-teal-600">{t.parentAccount}</p>
                        <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                            {t.headline}
                        </h2>
                        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">{t.intro}</p>

                        {user ? (
                            <SignedInPanel user={user} onSignOut={signOut} t={t} />
                        ) : (
                            <AuthPanel
                                authError={authError}
                                busy={busy}
                                form={form}
                                mode={mode}
                                modeCopy={modeCopy}
                                setForm={setForm}
                                setMode={setMode}
                                onSubmit={handleSubmit}
                                t={t}
                            />
                        )}
                    </div>

                    <aside className="space-y-4">
                        <StatusPanel health={health} healthError={healthError} t={t} />
                        {user && (
                            <AdminSettingsPanel
                                rolesSettings={rolesSettings}
                                settingsError={settingsError}
                                t={t}
                                user={user}
                            />
                        )}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-sm font-black uppercase text-violet-600">{t.nextStep}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{t.nextStepBody}</p>
                        </div>
                    </aside>
                </section>
            </div>
        </main>
    );
}

function canViewAdmin(role: Role) {
    return role === 'admin' || role === 'superadmin';
}

function AuthPanel({
    authError,
    busy,
    form,
    mode,
    modeCopy,
    setForm,
    setMode,
    onSubmit,
    t,
}: {
    authError: string | null;
    busy: boolean;
    form: FormState;
    mode: AuthMode;
    modeCopy: { title: string; submit: string };
    setForm: (form: FormState) => void;
    setMode: (mode: AuthMode) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    t: Record<string, string>;
}) {
    return (
        <form className="mt-8 max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={onSubmit}>
            <div className="mb-5 inline-flex w-full rounded-2xl bg-slate-100 p-1">
                {(['login', 'register'] satisfies AuthMode[]).map(option => (
                    <button
                        key={option}
                        className={`min-h-11 flex-1 rounded-xl text-sm font-black transition ${
                            mode === option ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        type="button"
                        onClick={() => setMode(option)}
                    >
                        {option === 'login' ? t.signIn : t.createAccount}
                    </button>
                ))}
            </div>

            <h3 className="text-lg font-black text-slate-950">{modeCopy.title}</h3>
            <div className="mt-4 space-y-3">
                {mode === 'register' && (
                    <Field
                        autoComplete="name"
                        label={t.displayName}
                        value={form.displayName}
                        onChange={displayName => setForm({ ...form, displayName })}
                    />
                )}
                <Field
                    autoComplete="email"
                    label={t.email}
                    type="email"
                    value={form.email}
                    onChange={email => setForm({ ...form, email })}
                />
                <Field
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    label={t.password}
                    minLength={mode === 'register' ? 8 : undefined}
                    type="password"
                    value={form.password}
                    onChange={password => setForm({ ...form, password })}
                />
            </div>

            {authError && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{authError}</p>}

            <button
                className="mt-5 min-h-12 w-full rounded-2xl bg-indigo-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={busy}
                type="submit"
            >
                {busy ? `${modeCopy.submit}...` : modeCopy.submit}
            </button>
        </form>
    );
}

function Field({
    autoComplete,
    label,
    minLength,
    onChange,
    type = 'text',
    value,
}: {
    autoComplete: string;
    label: string;
    minLength?: number;
    onChange: (value: string) => void;
    type?: string;
    value: string;
}) {
    return (
        <label className="block">
            <span className="text-xs font-black uppercase text-slate-500">{label}</span>
            <input
                autoComplete={autoComplete}
                className="mt-1 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                minLength={minLength}
                required
                type={type}
                value={value}
                onChange={event => onChange(event.target.value)}
            />
        </label>
    );
}

function SignedInPanel({ onSignOut, t, user }: { onSignOut: () => void; t: Record<string, string>; user: UserPublic }) {
    return (
        <div className="mt-8 max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-black uppercase text-emerald-700">{t.signedIn}</p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">{user.display_name}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-600">{user.email}</p>
            <p className="mt-3 text-sm text-slate-600">
                {t.role}: <span className="font-black text-slate-900">{user.role}</span>
            </p>
            <button
                className="mt-5 min-h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                type="button"
                onClick={onSignOut}
            >
                {t.signOut}
            </button>
        </div>
    );
}

function AdminSettingsPanel({
    rolesSettings,
    settingsError,
    t,
    user,
}: {
    rolesSettings: RolesSettings | null;
    settingsError: string | null;
    t: Record<string, string>;
    user: UserPublic;
}) {
    if (!canViewAdmin(user.role)) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black uppercase text-[#534AB7]">{t.adminSettings}</p>
                <p className="mt-2 text-sm leading-6 text-[#6D6997]">{t.noAdminAccess}</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[#E4E0F6] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-black uppercase text-[#534AB7]">{t.adminSettings}</p>
                    <h3 className="mt-1 text-lg font-bold text-[#0E0B55]">{t.rolesRights}</h3>
                </div>
                <span className="rounded-full bg-[#F0EDFF] px-3 py-1 text-xs font-bold text-[#534AB7]">
                    {user.role}
                </span>
            </div>

            {settingsError && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{settingsError}</p>}
            {!rolesSettings && !settingsError && (
                <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-[#6D6997]">{t.loadingSettings}</p>
            )}
            {rolesSettings && (
                <div className="mt-4 space-y-3">
                    {rolesSettings.roles.map(role => (
                        <div key={role.role} className="rounded-2xl border border-[#ECE8FA] bg-[#FBFAFF] p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-bold text-[#0E0B55]">{role.label}</p>
                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#6D6997]">
                                    {role.permissions.length} {t.permissions}
                                </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {role.permissions.map(permissionKey => {
                                    const permission = rolesSettings.permissions.find(item => item.key === permissionKey);
                                    return (
                                        <span
                                            key={permissionKey}
                                            className="rounded-full border border-[#DDD7F4] bg-white px-3 py-1 text-xs font-semibold text-[#534AB7]"
                                            title={permission?.description}
                                        >
                                            {permission?.label ?? permissionKey}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function StatusPanel({
    health,
    healthError,
    t,
}: {
    health: Health | null;
    healthError: string | null;
    t: Record<string, string>;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">{t.status}</h3>
            <div className="mt-4 space-y-2">
                <StatusRow label={t.web} ok value={t.up} />
                <StatusRow label={t.api} ok={health?.status === 'ok'} value={health ? health.status : healthError ? t.error : t.loading} />
                <StatusRow
                    label={t.mongo}
                    ok={health?.mongo === true}
                    value={health ? (health.mongo ? t.connected : t.error) : t.loading}
                />
            </div>
            {healthError && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{healthError}</p>}
        </div>
    );
}

function StatusRow({ label, ok, value }: { label: string; ok?: boolean; value: string }) {
    return (
        <div className="flex min-h-11 items-center justify-between rounded-xl bg-slate-50 px-3">
            <span className="text-sm font-bold text-slate-700">{label}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {value}
            </span>
        </div>
    );
}
