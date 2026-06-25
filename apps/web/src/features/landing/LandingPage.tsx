import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Role, UserPublic } from '@koda/contracts';
import {
    clearTokens,
    getHealth,
    getMe,
    getStoredToken,
    login,
    register,
    storeTokens,
    type Health,
} from '@/lib/api';
import { copy, type Locale } from '@/lib/i18n';
import { AppHeader, Button, Card, CardBody, CardKicker, CardTitle, Input } from '@/shared/ui';

type AuthMode = 'login' | 'register';

interface FormState {
    email: string;
    password: string;
    displayName: string;
}

const emptyForm: FormState = { email: '', password: '', displayName: '' };

export default function LandingPage() {
    const [locale, setLocale] = useState<Locale>('en');
    const t = copy[locale];
    const [mode, setMode] = useState<AuthMode>('login');
    const [form, setForm] = useState<FormState>(emptyForm);
    const [health, setHealth] = useState<Health | null>(null);
    const [healthError, setHealthError] = useState<string | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [user, setUser] = useState<UserPublic | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        getHealth()
            .then(setHealth)
            .catch(error => setHealthError(String(error instanceof Error ? error.message : error)));
    }, []);

    useEffect(() => {
        const token = getStoredToken();
        if (!token) return;
        getMe(token)
            .then(setUser)
            .catch(() => clearTokens());
    }, []);

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
        setAuthError(null);
    }

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#0B1120] dark:text-white">
            <AppHeader
                kicker={t.milestone}
                locale={locale}
                onLocaleChange={setLocale}
                actions={
                    user && canViewAdmin(user.role) ? (
                        <Link to="/admin">
                            <Button size="md">{t.adminConsole}</Button>
                        </Link>
                    ) : (
                        <Link to="/login">
                            <Button size="md" variant="outline">
                                {t.signIn}
                            </Button>
                        </Link>
                    )
                }
            />

            <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
                <section className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="max-w-2xl">
                        <p className="text-sm font-black uppercase tracking-wide text-brand-600 dark:text-brand-400">
                            {t.parentAccount}
                        </p>
                        <h2 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                            {t.headline}
                        </h2>
                        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                            {t.intro}
                        </p>

                        {user ? (
                            <SignedInPanel onSignOut={signOut} t={t} user={user} />
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
                        <Card>
                            <CardKicker>{t.nextStep}</CardKicker>
                            <CardTitle className="mt-2">{t.nextStep}</CardTitle>
                            <CardBody className="mt-2">{t.nextStepBody}</CardBody>
                        </Card>
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
    t: (typeof copy)['en'];
}) {
    return (
        <Card className="mt-8 max-w-md" padded={false}>
            <form className="space-y-4 p-5 sm:p-6" onSubmit={onSubmit}>
                <div className="inline-flex w-full rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                    {(['login', 'register'] satisfies AuthMode[]).map(option => {
                        const active = mode === option;
                        return (
                            <button
                                key={option}
                                className={`min-h-11 flex-1 rounded-xl text-sm font-black transition ${
                                    active
                                        ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-200'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                                type="button"
                                onClick={() => setMode(option)}
                            >
                                {option === 'login' ? t.signIn : t.createAccount}
                            </button>
                        );
                    })}
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white">{modeCopy.title}</h3>
                <div className="space-y-3">
                    {mode === 'register' && (
                        <Input
                            autoComplete="name"
                            label={t.displayName}
                            value={form.displayName}
                            onChange={event => setForm({ ...form, displayName: event.target.value })}
                        />
                    )}
                    <Input
                        autoComplete="email"
                        label={t.email}
                        type="email"
                        value={form.email}
                        onChange={event => setForm({ ...form, email: event.target.value })}
                    />
                    <Input
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        label={t.password}
                        minLength={mode === 'register' ? 8 : undefined}
                        required
                        type="password"
                        value={form.password}
                        onChange={event => setForm({ ...form, password: event.target.value })}
                    />
                </div>

                {authError && (
                    <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                        {authError}
                    </p>
                )}

                <Button className="w-full" loading={busy} loadingText={`${modeCopy.submit}…`} size="lg" type="submit">
                    {modeCopy.submit}
                </Button>
            </form>
        </Card>
    );
}

function SignedInPanel({ onSignOut, t, user }: { onSignOut: () => void; t: (typeof copy)['en']; user: UserPublic }) {
    return (
        <Card className="mt-8 max-w-md border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {t.signedIn}
            </p>
            <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{user.display_name}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">{user.email}</p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {t.role}:{' '}
                <span className="font-black text-slate-900 dark:text-white">{user.role}</span>
            </p>
            <div className="mt-5 flex gap-2">
                {canViewAdmin(user.role) && (
                    <Link to="/admin">
                        <Button>{t.adminConsole}</Button>
                    </Link>
                )}
                <Button variant="outline" onClick={onSignOut}>
                    {t.signOut}
                </Button>
            </div>
        </Card>
    );
}

function StatusPanel({
    health,
    healthError,
    t,
}: {
    health: Health | null;
    healthError: string | null;
    t: (typeof copy)['en'];
}) {
    return (
        <Card>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{t.status}</h3>
            <div className="mt-4 space-y-2">
                <StatusRow label={t.web} ok value={t.up} />
                <StatusRow
                    label={t.api}
                    ok={health?.status === 'ok'}
                    value={health ? health.status : healthError ? t.error : t.loading}
                />
                <StatusRow
                    label={t.mongo}
                    ok={health?.mongo === true}
                    value={health ? (health.mongo ? t.connected : t.error) : t.loading}
                />
            </div>
            {healthError && (
                <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    {healthError}
                </p>
            )}
        </Card>
    );
}

function StatusRow({ label, ok, value }: { label: string; ok?: boolean; value: string }) {
    return (
        <div className="flex min-h-11 items-center justify-between rounded-xl bg-slate-50 px-3 dark:bg-slate-800/60">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
            <span
                className={`rounded-full px-2.5 py-1 text-xs font-black ${
                    ok
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
            >
                {value}
            </span>
        </div>
    );
}
