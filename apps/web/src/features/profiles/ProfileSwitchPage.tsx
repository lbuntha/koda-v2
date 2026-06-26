import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { ChildProfile, ParentOnboardingState, ParentProfile, UserPublic } from '@koda/contracts';
import { clearTokens, getMe, getParentOnboarding, getParentProfile, getStoredToken, loginChildProfile } from '@/lib/api';

export default function ProfileSwitchPage() {
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<UserPublic | null>(null);
    const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
    const [onboarding, setOnboarding] = useState<ParentOnboardingState | null>(null);
    const [loading, setLoading] = useState(true);
    const [busyChildId, setBusyChildId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = getStoredToken();
        if (!storedToken) {
            setLoading(false);
            return;
        }
        setToken(storedToken);
        getMe(storedToken)
            .then(async currentUser => {
                setUser(currentUser);
                if (currentUser.role === 'parent') {
                    const [profile, onboardingState] = await Promise.all([
                        getParentProfile(storedToken),
                        getParentOnboarding(storedToken),
                    ]);
                    setParentProfile(profile);
                    setOnboarding(onboardingState);
                }
            })
            .catch(() => {
                clearTokens();
                setToken(null);
            })
            .finally(() => setLoading(false));
    }, []);

    if (!loading && !token) {
        return <Navigate replace to="/login?next=%2Fprofiles" />;
    }

    if (!loading && user && user.role !== 'parent') {
        if (user.role === 'admin') return <Navigate replace to="/admin" />;
        if (user.role === 'teacher') return <Navigate replace to="/teacher" />;
        return <Navigate replace to="/student" />;
    }

    async function openKid(child: ChildProfile) {
        if (!token) return;
        setBusyChildId(child._id);
        setError(null);
        try {
            const childSession = await loginChildProfile(token, child._id);
            window.sessionStorage.setItem('koda.childProfileSession', JSON.stringify(childSession));
            navigate(child.placement_status === 'complete' ? '/kid' : '/kid/placement');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusyChildId(null);
        }
    }

    return (
        <main className="min-h-screen overflow-hidden bg-[#FBFAFF] px-5 py-8 text-[#0E0B55] transition-colors dark:bg-[#111111] dark:text-white">
            <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-gradient-to-b from-[#F1EDFF] to-transparent dark:from-black/60" />
            <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl flex-col items-center justify-center">
                <h1 className="koda-admin-page-title text-center">Who is learning?</h1>
                <p className="koda-admin-label mt-3 text-center">
                    Choose a profile to continue.
                </p>

                {error && (
                    <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>
                )}

                <div className="mt-9 flex w-full flex-wrap items-start justify-center gap-x-7 gap-y-8 sm:gap-x-9">
                    {loading && (
                        <>
                            <ProfileSkeleton />
                            <ProfileSkeleton />
                            <ProfileSkeleton />
                        </>
                    )}
                    {!loading && user && (
                        <ProfileCard
                            avatarSvg={parentProfile?.avatar_svg}
                            avatarUrl={parentProfile?.avatar_url}
                            name={user.display_name}
                            subtitle="Parent"
                            variant="parent"
                            onClick={() => navigate('/parent')}
                        />
                    )}
                    {!loading && onboarding?.children.filter(child => !child.disabled_at).map(child => (
                        <ProfileCard
                            key={child._id}
                            avatarSvg={child.avatar_svg}
                            avatarUrl={child.avatar_url}
                            disabled={busyChildId === child._id}
                            name={child.display_name}
                            subtitle={child.placement_status === 'complete' ? 'Ready to learn' : 'Placement needed'}
                            variant="kid"
                            onClick={() => openKid(child)}
                        />
                    ))}
                    {!loading && (
                        <button
                            className="group w-32 text-center sm:w-36"
                            type="button"
                            onClick={() => navigate('/parent/onboarding')}
                        >
                            <div className="mx-auto grid aspect-square w-28 place-items-center rounded-[0.2rem] bg-[#F0ECFA] text-[#534AB7] transition group-hover:bg-[#E7E2F6] group-hover:text-[#0E0B55] dark:bg-[#333] dark:text-[#A3A3A3] dark:group-hover:bg-[#444] dark:group-hover:text-white sm:w-32">
                                <Plus className="h-14 w-14" strokeWidth={3} />
                            </div>
                            <h2 className="koda-admin-nav-label mt-3 truncate text-[#6D6997] transition group-hover:text-[#0E0B55] dark:text-[#8C8C8C] dark:group-hover:text-white">Add kid</h2>
                        </button>
                    )}
                </div>

                {!loading && (
                    <button
                        className="koda-admin-nav-label mt-12 min-h-10 border border-[#8D89AE] px-5 text-[#6D6997] transition hover:border-[#0E0B55] hover:text-[#0E0B55] dark:border-[#808080] dark:text-[#8C8C8C] dark:hover:border-white dark:hover:text-white"
                        type="button"
                        onClick={() => navigate('/parent/children')}
                    >
                        Manage profiles
                    </button>
                )}
            </div>
        </main>
    );
}

function ProfileCard({
    avatarSvg,
    avatarUrl,
    disabled,
    name,
    onClick,
    subtitle,
    variant,
}: {
    avatarSvg?: string | null;
    avatarUrl?: string | null;
    disabled?: boolean;
    name: string;
    onClick: () => void;
    subtitle: string;
    variant: 'parent' | 'kid';
}) {
    return (
        <button
            className="group w-32 text-center disabled:cursor-not-allowed disabled:opacity-60 sm:w-36"
            disabled={disabled}
            type="button"
            onClick={onClick}
        >
            <AvatarImage
                name={name}
                svg={avatarSvg}
                url={avatarUrl}
                variant={variant}
            />
            <h2 className="koda-admin-nav-label mt-3 truncate text-[#6D6997] transition group-hover:text-[#0E0B55] dark:text-[#8C8C8C] dark:group-hover:text-white">{name}</h2>
            <p className="mt-1 truncate text-xs font-medium text-[#8D89AE] dark:text-[#666]">{subtitle}</p>
        </button>
    );
}

function AvatarImage({
    name,
    svg,
    url,
    variant,
}: {
    name: string;
    svg?: string | null;
    url?: string | null;
    variant: 'parent' | 'kid';
}) {
    const baseClass = 'mx-auto aspect-square w-28 overflow-hidden rounded-[0.2rem] border-2 border-transparent shadow-sm transition group-hover:border-[#0E0B55] dark:group-hover:border-white sm:w-32';
    if (svg) {
        return <div aria-label={`${name} avatar`} className={baseClass} dangerouslySetInnerHTML={{ __html: svg }} role="img" />;
    }
    if (url) {
        return <img alt={name} className={`${baseClass} object-cover`} src={url} />;
    }
    const fallbackClass = variant === 'parent'
        ? 'bg-gradient-to-br from-[#7C6DD8] to-[#534AB7] text-white'
        : 'bg-[#F2EEFF] text-[#534AB7] dark:bg-[#333] dark:text-white';
    return (
        <div className={`${baseClass} grid place-items-center text-4xl font-semibold ${fallbackClass}`}>
            {getInitials(name)}
        </div>
    );
}

function ProfileSkeleton() {
    return (
        <div className="w-32 text-center sm:w-36">
            <div className="mx-auto aspect-square w-28 rounded-[0.2rem] bg-[#F2EEFF] dark:bg-[#333] sm:w-32" />
            <div className="mx-auto mt-3 h-4 w-24 rounded bg-[#E7E2F6] dark:bg-[#333]" />
        </div>
    );
}

function getInitials(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'K';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
