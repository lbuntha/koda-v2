import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPostAuthDestination } from '@/features/auth/authRedirect';
import type { Role, UserPublic } from '@koda/contracts';
import {
    clearTokens,
    getMe,
    getStoredToken,
    login,
    storeTokens,
} from '@/lib/api';
import { copy, type Locale } from '@/lib/i18n';
import { Button, Card, Input, LocaleSwitcher } from '@/shared/ui';

interface FormState {
    email: string;
    password: string;
}

const emptyForm: FormState = { email: '', password: '' };

export default function LandingPage() {
    const navigate = useNavigate();
    const [locale, setLocale] = useState<Locale>('en');
    const t = copy[locale];
    const [form, setForm] = useState<FormState>(emptyForm);
    const [authError, setAuthError] = useState<string | null>(null);
    const [user, setUser] = useState<UserPublic | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const token = getStoredToken();
        if (!token) return;
        getMe(token)
            .then(setUser)
            .catch(() => clearTokens());
    }, []);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setAuthError(null);
        try {
            const tokens = await login(form.email, form.password);
            storeTokens(tokens);
            setUser(tokens.user);
            setForm(emptyForm);
            const destination = getPostAuthDestination('', tokens.user.role, '/admin');
            if (destination) {
                navigate(destination, { replace: true });
            }
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
        <main className="min-h-screen bg-[#FBFAFF] text-[#0E0B55] transition-colors duration-300 dark:bg-[#0B1120] dark:text-white">
            <header className="fixed left-0 right-0 top-0 z-30 flex items-center justify-between px-5 py-4 sm:px-8">
                <Link className="flex items-center gap-2" to="/">
                    <img alt="Koda" className="h-9 w-9 rounded-xl object-cover shadow-sm" src="/icons/icon-192.png" />
                    <span className="text-lg font-semibold text-[#090B1F] dark:text-white">Koda</span>
                </Link>
                <LocaleSwitcher label="" locale={locale} onChange={setLocale} />
            </header>

            <section className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_430px]">
                <div className="flex min-h-[56vh] flex-col items-center justify-center px-5 pb-10 pt-24 lg:min-h-screen lg:px-10">
                    <div className="w-full max-w-3xl text-center">
                        <p className="text-sm font-semibold uppercase text-[#534AB7] dark:text-brand-300">{t.parentAccount}</p>
                        <h1 className="mt-6 text-3xl font-semibold leading-tight text-[#090B1F] sm:text-4xl dark:text-white">
                            {t.kodaReadyTitle}
                        </h1>
                        <div className="mx-auto mt-8 flex min-h-16 w-full max-w-2xl items-center gap-3 rounded-[2rem] border border-[#E6E1F3] bg-white px-5 shadow-[0_18px_70px_rgba(83,74,183,0.12)] dark:border-slate-800 dark:bg-slate-900">
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F4F1FF] text-xl text-[#534AB7] dark:bg-slate-800">
                                +
                            </span>
                            <span className="flex-1 text-left text-base font-medium text-[#8A8FA3]">{t.kodaPromptPlaceholder}</span>
                            <span className="rounded-full bg-[#F4F1FF] px-4 py-2 text-sm font-semibold text-[#534AB7] dark:bg-slate-800 dark:text-brand-200">
                                {t.navLearn}
                            </span>
                        </div>
                    </div>
                </div>

                <aside className="flex min-h-[44vh] items-start justify-center border-l border-[#E7E2F6] bg-[#F3F0FA] px-5 py-8 sm:items-center sm:py-10 lg:min-h-screen lg:px-8 dark:border-slate-800 dark:bg-slate-900">
                    {user ? (
                        <SignedInPanel onSignOut={signOut} t={t} user={user} />
                    ) : (
                        <AuthPanel
                            authError={authError}
                            busy={busy}
                            form={form}
                            setForm={setForm}
                            onSubmit={handleSubmit}
                            t={t}
                        />
                    )}
                </aside>
            </section>
        </main>
    );
}

function canViewAdmin(role: Role) {
    return role === 'admin';
}

function AuthPanel({
    authError,
    busy,
    form,
    setForm,
    onSubmit,
    t,
}: {
    authError: string | null;
    busy: boolean;
    form: FormState;
    setForm: (form: FormState) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    t: (typeof copy)['en'];
}) {
    return (
        <div className="w-full max-w-sm">
            <form className="space-y-4 sm:space-y-5" onSubmit={onSubmit}>
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-[#0E0B55] sm:text-3xl dark:text-white">{t.authPanelTitle}</h2>
                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#6D6997] sm:mt-3 sm:text-base dark:text-slate-300">
                        {t.authPanelBody}
                    </p>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                    <SocialButton label={t.continueWithGoogle}>
                        <GoogleIcon />
                    </SocialButton>
                    <SocialButton label={t.continueWithApple}>
                        <AppleIcon />
                    </SocialButton>
                </div>

                <div className="flex items-center gap-4 py-1">
                    <div className="h-px flex-1 bg-[#D8D2EA] dark:bg-slate-700" />
                    <span className="text-xs font-semibold uppercase text-[#6D6997] dark:text-slate-400">{t.or}</span>
                    <div className="h-px flex-1 bg-[#D8D2EA] dark:bg-slate-700" />
                </div>

                <div className="inline-flex w-full rounded-full bg-white/70 p-1 shadow-sm dark:bg-slate-800">
                    <button
                        className="min-h-10 flex-1 rounded-full bg-white text-sm font-semibold text-[#534AB7] shadow-sm transition sm:min-h-11 dark:bg-slate-900 dark:text-white"
                        type="button"
                    >
                        {t.signIn}
                    </button>
                    <Link
                        className="flex min-h-10 flex-1 items-center justify-center rounded-full text-sm font-semibold text-[#6D6997] transition hover:text-[#0E0B55] sm:min-h-11 dark:text-slate-400 dark:hover:text-white"
                        to="/signup"
                    >
                        {t.createAccount}
                    </Link>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                    <Input
                        autoComplete="email"
                        label={t.email}
                        type="email"
                        value={form.email}
                        onChange={event => setForm({ ...form, email: event.target.value })}
                    />
                    <Input
                        autoComplete="current-password"
                        label={t.password}
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

                <Button
                    className="h-12 w-full rounded-full sm:h-[52px]"
                    loading={busy}
                    loadingText={`${t.submitSignIn}...`}
                    size="lg"
                    type="submit"
                >
                    {t.submitSignIn}
                </Button>

                <p className="text-center text-[11px] leading-4 text-[#777777] sm:text-xs sm:leading-5 dark:text-slate-400">
                    {t.authTermsText}
                </p>
            </form>
        </div>
    );
}

function SignedInPanel({ onSignOut, t, user }: { onSignOut: () => void; t: (typeof copy)['en']; user: UserPublic }) {
    return (
        <Card className="w-full max-w-sm border-transparent bg-transparent text-center shadow-none dark:bg-transparent">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#4B4B4B] text-xl font-semibold text-white">
                {user.display_name.slice(0, 1).toUpperCase()}
            </div>
            <p className="mt-5 text-sm font-semibold uppercase text-[#534AB7] dark:text-brand-300">{t.signedIn}</p>
            <h3 className="mt-2 text-3xl font-medium text-[#111111] dark:text-white">{user.display_name}</h3>
            <p className="mt-2 text-sm font-medium text-[#666666] dark:text-slate-300">{user.email}</p>
            <div className="mt-5 flex gap-2">
                {canViewAdmin(user.role) && (
                    <Link className="flex-1" to="/admin">
                        <Button className="w-full rounded-full">{t.adminConsole}</Button>
                    </Link>
                )}
                <Button className="flex-1 rounded-full" variant="outline" onClick={onSignOut}>
                    {t.signOut}
                </Button>
            </div>
        </Card>
    );
}

function SocialButton({ children, label }: { children: ReactNode; label: string }) {
    return (
        <button
            className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[#D8D2EA] bg-white px-4 text-sm font-semibold text-[#0E0B55] shadow-sm transition hover:border-[#BFB6E6] hover:bg-[#FBFAFF] sm:h-[52px] dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
            type="button"
        >
            {children}
            <span>{label}</span>
        </button>
    );
}

function GoogleIcon() {
    return (
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.52Z" fill="#4285F4" />
            <path d="M12 22c2.7 0 4.97-.9 6.62-2.45l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" fill="#34A853" />
            <path d="M6.41 13.88A6 6 0 0 1 6.1 12c0-.65.11-1.29.31-1.88V7.53H3.07A10 10 0 0 0 2 12c0 1.61.39 3.13 1.07 4.47l3.34-2.59Z" fill="#FBBC04" />
            <path d="M12 6c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.93 5.53l3.34 2.59C7.2 7.76 9.4 6 12 6Z" fill="#EA4335" />
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.53 12.74c-.03-2.43 1.98-3.6 2.07-3.66-1.13-1.66-2.9-1.89-3.52-1.91-1.5-.15-2.93.88-3.69.88-.77 0-1.96-.86-3.22-.84-1.66.02-3.19.97-4.04 2.46-1.72 2.98-.44 7.39 1.24 9.8.82 1.19 1.8 2.53 3.09 2.48 1.24-.05 1.71-.8 3.21-.8s1.92.8 3.23.77c1.33-.02 2.18-1.21 2.99-2.41.94-1.38 1.33-2.72 1.35-2.79-.03-.01-2.59-.99-2.71-3.98ZM14.1 5.59c.68-.82 1.14-1.96 1.01-3.09-.98.04-2.17.65-2.87 1.47-.63.73-1.18 1.9-1.03 3.02 1.09.08 2.21-.56 2.89-1.4Z" />
        </svg>
    );
}
