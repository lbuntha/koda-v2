import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { LockKeyhole, Mail, User, UserPlus } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { clearTokens, getMe, getStoredToken, register, storeTokens } from '@/lib/api';
import { copy, type Locale } from '@/lib/i18n';
import { getPostAuthDestination } from './authRedirect';
import { Button } from '@/shared/ui';

export default function SignupPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const next = params.get('next') ?? '';
    const [locale] = useState<Locale>('en');
    const t = copy[locale];
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = getStoredToken();
        if (!token) return;
        getMe(token)
            .then(user => navigate(getPostAuthDestination(next, user.role, '/') ?? '/', { replace: true }))
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
            const tokens = await register({
                email,
                password,
                display_name: displayName,
                locale,
            });
            storeTokens(tokens);
            navigate(getPostAuthDestination(next, tokens.user.role, '/') ?? '/', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setBusy(false);
        }
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_78%_52%,rgba(249,214,181,0.46),transparent_28%),linear-gradient(105deg,#F0F1FF_0%,#FBFAFF_48%,#FFF3E7_100%)] px-4 py-4 text-[#0E0B55] transition-colors duration-300 sm:px-5 sm:py-6 dark:bg-[#0B1120] dark:text-white">
            <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[500px] flex-col items-center justify-center sm:min-h-[calc(100vh-3rem)]">
                <Link className="mb-3 sm:mb-4" to="/">
                    <img alt="Koda" className="h-11 w-11 rounded-[1rem] object-cover shadow-[0_16px_38px_rgba(83,74,183,0.22)] sm:h-[52px] sm:w-[52px]" src="/icons/icon-192.png" />
                </Link>

                <header className="text-center">
                    <h1 className="text-xl font-semibold text-[#0E0B55] sm:text-2xl dark:text-white">{t.signupProfileTitle}</h1>
                    <p className="mt-1.5 text-xs font-semibold text-[#6D6997] sm:text-sm dark:text-slate-300">{t.signupProfileSubtitle}</p>
                </header>

                <section className="mt-4 w-full rounded-[1.25rem] border border-[#E2DCF4] bg-white p-4 shadow-[0_22px_62px_rgba(83,74,183,0.12)] sm:mt-5 sm:rounded-[1.35rem] sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                    <form className="space-y-3" onSubmit={handleSubmit}>
                        {nextHint && (
                            <p className="rounded-2xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 dark:bg-slate-800 dark:text-brand-200">
                                {nextHint}
                            </p>
                        )}
                        <SignupInput
                            autoComplete="name"
                            icon={<User className="h-5 w-5" />}
                            label={t.fullName}
                            placeholder="John Doe"
                            required
                            value={displayName}
                            onChange={event => setDisplayName(event.target.value)}
                        />
                        <SignupInput
                            autoComplete="email"
                            icon={<Mail className="h-5 w-5" />}
                            label={t.emailAddress}
                            placeholder="you@example.com"
                            required
                            type="email"
                            value={email}
                            onChange={event => setEmail(event.target.value)}
                        />
                        <SignupInput
                            autoComplete="new-password"
                            icon={<LockKeyhole className="h-5 w-5" />}
                            label={t.password}
                            minLength={6}
                            placeholder={t.enterPassword}
                            required
                            type="password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                        />
                        <p className="-mt-1 text-sm font-semibold text-[#6D6997] dark:text-slate-300">{t.minPassword}</p>

                        <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-[#E2DCF4] bg-[#FBFAFF] px-3 py-2.5 text-xs font-semibold text-[#6D6997] sm:min-h-12 sm:px-4 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                            <input
                                checked={acceptedTerms}
                                className="h-5 w-5 rounded border-[#A7A2B8] text-[#534AB7] focus:ring-[#BDB4F4]"
                                required
                                type="checkbox"
                                onChange={event => setAcceptedTerms(event.target.checked)}
                            />
                            <span>
                                {t.agreePrefix}{' '}
                                <a className="text-[#534AB7] hover:underline" href="/terms">{t.terms}</a>
                                {' '}{t.and}{' '}
                                <a className="text-[#534AB7] hover:underline" href="/privacy">{t.privacyPolicy}</a>.
                            </span>
                        </label>

                        {error && (
                            <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                                {error}
                            </p>
                        )}

                        <Button
                            className="h-11 w-full rounded-2xl text-sm sm:h-12"
                            disabled={!acceptedTerms}
                            leftIcon={<UserPlus className="h-5 w-5" />}
                            loading={busy}
                            loadingText={`${t.signupCta}...`}
                            size="lg"
                            type="submit"
                        >
                            {t.signupCta}
                        </Button>

                        <div className="flex items-center gap-4 py-1">
                            <div className="h-px flex-1 bg-[#EEEAF9] dark:bg-slate-800" />
                            <span className="text-sm font-semibold text-[#8D89AE]">{t.or}</span>
                            <div className="h-px flex-1 bg-[#EEEAF9] dark:bg-slate-800" />
                        </div>

                        <button
                            className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-[#EEEAF9] bg-white text-sm font-semibold text-[#8D89AE] transition hover:border-[#D8D2EA] hover:text-[#0E0B55] sm:h-12 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-white"
                            type="button"
                        >
                            <GoogleIcon />
                            <span>{t.signupWithGoogle}</span>
                        </button>
                    </form>
                </section>
            </div>
        </main>
    );
}

type SignupInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    icon: ReactNode;
    label: string;
};

function SignupInput({ className = '', icon, label, ...rest }: SignupInputProps) {
    const required = Boolean(rest.required);
    return (
        <label className="block">
            <span className="text-xs font-semibold uppercase text-[#8D89AE] dark:text-slate-400">
                {label}
                {required && <span className="ml-1 text-rose-500">*</span>}
            </span>
            <span className="mt-1 flex min-h-11 items-center gap-3 rounded-2xl border border-[#E2DCF4] bg-white px-3 text-[#8D89AE] transition focus-within:border-[#BDB4F4] focus-within:ring-4 focus-within:ring-[#EEEAF9] sm:min-h-12 sm:px-4 dark:border-slate-800 dark:bg-slate-950 dark:focus-within:ring-slate-800">
                {icon}
                <input
                    className={`min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#0E0B55] outline-none placeholder:text-[#A7B0C1] dark:text-white dark:placeholder:text-slate-500 ${className}`}
                    {...rest}
                />
            </span>
        </label>
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
