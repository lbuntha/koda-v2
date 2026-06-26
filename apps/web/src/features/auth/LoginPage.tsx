import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { clearTokens, getMe, getStoredToken, login, storeTokens } from '@/lib/api';
import { copy, type Locale } from '@/lib/i18n';
import { getPostAuthDestination } from './authRedirect';
import { AppHeader, Button, Card, Input } from '@/shared/ui';

export default function LoginPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const next = params.get('next') ?? '';
    const [locale, setLocale] = useState<Locale>('en');
    const t = copy[locale];
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = getStoredToken();
        if (!token) return;
        getMe(token)
            .then(user => navigate(getPostAuthDestination(next, user.role, '/admin') ?? '/', { replace: true }))
            .catch(() => clearTokens());
    }, [navigate, next]);

    const nextHint = useMemo(() => {
        if (!next) return null;
        return t.loginNextHint.replace('{target}', next);
    }, [next, t.loginNextHint]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setError(null);
        try {
            const tokens = await login(email, password);
            const destination = getPostAuthDestination(next, tokens.user.role, '/admin');
            if (!destination) {
                setError(t.loginNotAdmin);
                setBusy(false);
                return;
            }
            storeTokens(tokens);
            navigate(destination, { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setBusy(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#FBFAFF] transition-colors duration-300 dark:bg-[#0B1120]">
            <AppHeader locale={locale} onLocaleChange={setLocale} kicker={t.adminConsole} />
            <div className="mx-auto flex w-full max-w-md flex-col px-5 py-12 sm:px-8">
                <Card padded={false} className="overflow-hidden border-[#E7E2F6] shadow-sm">
                    <div className="border-b border-[#F0ECFA] px-6 py-5 sm:px-8 sm:py-6 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase text-[#534AB7] dark:text-brand-300">{t.adminConsole}</p>
                        <h1 className="mt-2 text-2xl font-semibold text-[#090B1F] sm:text-3xl dark:text-white">{t.loginTitle}</h1>
                        <p className="mt-2 text-sm leading-6 text-[#5F6880] dark:text-slate-300">{t.loginSubtitle}</p>
                    </div>
                    <form className="space-y-4 px-6 py-6 sm:px-8" onSubmit={handleSubmit}>
                        {nextHint && (
                            <p className="rounded-2xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 dark:bg-slate-800 dark:text-brand-200">
                                {nextHint}
                            </p>
                        )}
                        <Input
                            autoComplete="email"
                            label={t.email}
                            required
                            type="email"
                            value={email}
                            onChange={event => setEmail(event.target.value)}
                        />
                        <Input
                            autoComplete="current-password"
                            label={t.password}
                            required
                            type="password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                        />

                        {error && (
                            <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                                {error}
                            </p>
                        )}

                        <Button className="w-full" loading={busy} loadingText={`${t.loginCta}…`} size="lg" type="submit">
                            {t.loginCta}
                        </Button>

                        <p className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {t.loginNoAccount}{' '}
                            <Link
                                className="text-brand-700 underline-offset-2 hover:underline dark:text-brand-200"
                                to={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'}
                            >
                                {t.signupCta}
                            </Link>
                        </p>
                    </form>
                </Card>
            </div>
        </main>
    );
}
