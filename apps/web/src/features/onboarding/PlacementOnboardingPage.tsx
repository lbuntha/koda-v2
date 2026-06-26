import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Baby, Check, LogIn, Plus, Sparkles } from 'lucide-react';
import type {
    AgeRangeItem,
    ChildProfile,
    ParentOnboardingState,
    PlacementBand,
    PlacementQuestion,
    PlacementResultSummary,
    PlacementSession,
    SubjectItem,
} from '@koda/contracts';
import { AdminPageLayout } from '@/features/admin/components/AdminPageLayout';
import type { ParentOutletContext } from '@/features/parent/ParentLayout';
import {
    answerKidPlacementQuestion,
    completeKidPlacementSession,
    createOnboardingChild,
    getNextKidPlacementQuestion,
    getParentOnboarding,
    loginChildProfile,
} from '@/lib/api';
import { Button, Input } from '@/shared/ui';

type Step = 'child' | 'kidLogin' | 'intro' | 'questions' | 'result';

interface ChildDraft {
    name: string;
    ageRangeId: string;
    locale: string;
    subjectIds: string[];
    primarySubjectId: string;
}

const EMPTY_DRAFT: ChildDraft = {
    name: '',
    ageRangeId: '',
    locale: 'en',
    subjectIds: [],
    primarySubjectId: '',
};

const STEP_ORDER: Step[] = ['child', 'kidLogin', 'intro', 'questions', 'result'];
const STEP_LABELS = ['Kid profile', 'Kid login', 'Intro', 'Check', 'Result'] as const;
const QUESTION_TOTAL_FALLBACK = 6;

export default function PlacementOnboardingPage() {
    const { token } = useOutletContext<ParentOutletContext>();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('child');
    const [draft, setDraft] = useState<ChildDraft>(EMPTY_DRAFT);
    const [onboarding, setOnboarding] = useState<ParentOnboardingState | null>(null);
    const [activeChild, setActiveChild] = useState<ChildProfile | null>(null);
    const [childToken, setChildToken] = useState<string | null>(null);
    const [session, setSession] = useState<PlacementSession | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<PlacementQuestion | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const ageRanges = useMemo(
        () => (onboarding?.catalog.age_ranges ?? []).filter(item => item.enabled),
        [onboarding],
    );
    const subjects = useMemo(
        () => (onboarding?.catalog.subjects ?? []).filter(item => item.enabled),
        [onboarding],
    );
    const selectedSubjectId = activeChild?.primary_subject_id ?? draft.primarySubjectId;
    const activeSubject = subjects.find(subject => subject.id === selectedSubjectId) ?? subjects[0];
    const answeredCount = session?.answers.length ?? 0;
    const questionNumber = Math.min(answeredCount + 1, QUESTION_TOTAL_FALLBACK);
    const progress = step === 'questions' ? (questionNumber / QUESTION_TOTAL_FALLBACK) * 100 : 0;

    useEffect(() => {
        loadOnboarding();
    }, [token]);

    async function loadOnboarding() {
        setLoading(true);
        setError(null);
        try {
            const data = await getParentOnboarding(token);
            setOnboarding(data);
            setDraft(current => initializeDraft(current, data));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }

    function updateAgeRange(ageRangeId: string) {
        const nextAgeRange = ageRanges.find(item => item.id === ageRangeId) ?? ageRanges[0];
        const nextSubjectIds = nextAgeRange?.subject_ids.filter(id => subjects.some(subject => subject.id === id)) ?? [];
        setDraft(current => ({
            ...current,
            ageRangeId,
            subjectIds: nextSubjectIds,
            primarySubjectId: nextSubjectIds[0] ?? '',
        }));
    }

    async function createKidProfile(event: FormEvent) {
        event.preventDefault();
        if (!draft.name.trim() || !draft.ageRangeId || draft.subjectIds.length === 0 || !draft.primarySubjectId) return;
        setBusy(true);
        setError(null);
        try {
            const child = await createOnboardingChild(token, {
                display_name: draft.name.trim(),
                age_range_id: draft.ageRangeId,
                subject_ids: draft.subjectIds,
                primary_subject_id: draft.primarySubjectId,
                locale: draft.locale,
            });
            setActiveChild(child);
            setOnboarding(current => current ? { ...current, children: [...current.children, child] } : current);
            setStep('kidLogin');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    }

    async function loginAsKidProfile() {
        if (!activeChild?.primary_subject_id) return;
        setBusy(true);
        setError(null);
        try {
            const childSession = await loginChildProfile(token, activeChild._id);
            window.sessionStorage.setItem('koda.childProfileSession', JSON.stringify(childSession));
            navigate('/kid/placement');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    }

    async function beginQuestions() {
        if (!session || currentQuestion) {
            setStep('questions');
            return;
        }
        if (!childToken) {
            setError('Kid profile login is required before placement.');
            setStep('kidLogin');
            return;
        }
        setBusy(true);
        setError(null);
        try {
            const question = await getNextKidPlacementQuestion(childToken, session._id);
            setCurrentQuestion(question);
            setStep(question ? 'questions' : 'result');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    }

    async function answerQuestion(value: string | number) {
        if (!session || !currentQuestion || !childToken) return;
        setBusy(true);
        setError(null);
        try {
            const answeredSession = await answerKidPlacementQuestion(childToken, session._id, {
                question_id: currentQuestion.id,
                selected_value: value,
            });
            const nextQuestion = await getNextKidPlacementQuestion(childToken, session._id);
            if (nextQuestion) {
                setSession(answeredSession);
                setCurrentQuestion(nextQuestion);
                return;
            }
            const completed = await completeKidPlacementSession(childToken, session._id);
            setSession(completed);
            setCurrentQuestion(null);
            await refreshActiveChild(completed.child_profile_id);
            setStep('result');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    }

    async function refreshActiveChild(childId: string) {
        const data = await getParentOnboarding(token);
        setOnboarding(data);
        setActiveChild(data.children.find(child => child._id === childId) ?? null);
    }

    function addAnotherChild() {
        setDraft(initializeDraft(EMPTY_DRAFT, onboarding));
        setActiveChild(null);
        setChildToken(null);
        setSession(null);
        setCurrentQuestion(null);
        setError(null);
        setStep('child');
    }

    const result = session?.result ?? activeChild?.placement_result_summary ?? null;

    return (
        <AdminPageLayout
            className="max-w-7xl text-[#0E0B55] dark:text-white"
            description="Parents add a kid profile, then the kid logs in to complete a short placement check."
            title="Onboard kids"
        >
            <div className="mx-auto w-full max-w-3xl">
                <div className="rounded-3xl border border-[#E5DFF8] bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase text-[#5B52C6]">Parent setup</p>
                            <h2 className="text-xl font-semibold">Placement</h2>
                        </div>
                        {(onboarding?.children.length ?? 0) > 0 && (
                            <Button
                                leftIcon={<Plus className="h-4 w-4" />}
                                size="sm"
                                variant="outline"
                                onClick={addAnotherChild}
                            >
                                Add child
                            </Button>
                        )}
                    </div>
                    <div className="mt-4 grid grid-cols-5 gap-1.5">
                        {STEP_ORDER.map((item, index) => (
                            <div
                                key={item}
                                className={`h-2 rounded-full ${stepIndex(step) >= index ? 'bg-[#5B52C6] dark:bg-brand-400' : 'bg-[#E7E2F6] dark:bg-slate-800'}`}
                            />
                        ))}
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-5">
                        {STEP_LABELS.map((label, index) => (
                            <div
                                key={label}
                                className={`rounded-2xl px-3 py-2 text-xs font-semibold ${
                                    stepIndex(step) === index
                                        ? 'bg-[#F2EEFF] text-[#534AB7] dark:bg-brand-400/15 dark:text-brand-200'
                                        : stepIndex(step) > index
                                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                                          : 'bg-[#FBFAFF] text-[#8D89AE] dark:bg-slate-800/80 dark:text-slate-400'
                                }`}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>
                )}

                <div className="mt-4 flex justify-center rounded-3xl border border-[#E5DFF8] bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:p-6">
                    <div className="w-full max-w-3xl">
                        {loading && <LoadingCard />}
                        {!loading && ageRanges.length === 0 && <EmptyCatalogCard />}
                        {!loading && ageRanges.length > 0 && step === 'child' && (
                            <ChildStep
                                ageRanges={ageRanges}
                                busy={busy}
                                draft={draft}
                                onAgeRangeChange={updateAgeRange}
                                onChange={setDraft}
                                onSubmit={createKidProfile}
                            />
                        )}
                        {!loading && step === 'kidLogin' && activeChild && activeSubject && (
                            <KidLoginStep
                                busy={busy}
                                child={activeChild}
                                subject={activeSubject}
                                onBack={addAnotherChild}
                                onLogin={loginAsKidProfile}
                            />
                        )}
                        {!loading && step === 'intro' && activeSubject && (
                            <IntroStep
                                busy={busy}
                                childName={activeChild?.display_name ?? draft.name}
                                subject={activeSubject}
                                onBack={() => setStep('kidLogin')}
                                onStart={beginQuestions}
                            />
                        )}
                        {!loading && step === 'questions' && currentQuestion && activeSubject && (
                            <QuestionStep
                                busy={busy}
                                progress={progress}
                                question={currentQuestion}
                                questionIndex={questionNumber - 1}
                                subject={activeSubject}
                                total={QUESTION_TOTAL_FALLBACK}
                                onAnswer={answerQuestion}
                            />
                        )}
                        {!loading && step === 'questions' && !currentQuestion && (
                            <LoadingCard title="Preparing next question" />
                        )}
                        {!loading && step === 'result' && (
                            <ResultStep
                                childName={activeChild?.display_name ?? draft.name}
                                result={result}
                                subject={activeSubject}
                                onAddAnother={addAnotherChild}
                                onDashboard={() => navigate('/parent')}
                            />
                        )}
                    </div>
                </div>
            </div>
        </AdminPageLayout>
    );
}

function ChildStep({
    ageRanges,
    busy,
    draft,
    onAgeRangeChange,
    onChange,
    onSubmit,
}: {
    ageRanges: AgeRangeItem[];
    busy: boolean;
    draft: ChildDraft;
    onAgeRangeChange: (ageRangeId: string) => void;
    onChange: (draft: ChildDraft) => void;
    onSubmit: (event: FormEvent) => void;
}) {
    return (
        <form className="space-y-5" onSubmit={onSubmit}>
            <StepHeader
                icon={<Baby className="h-5 w-5" />}
                title="Child profile"
                body="Add the kid first. Koda will prepare the placement from the selected learning range."
            />
            <div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <Input
                            required
                            label="Child name"
                            placeholder="Child name"
                            value={draft.name}
                            onChange={event => onChange({ ...draft, name: event.target.value })}
                        />
                    </div>
                    <label className="block">
                        <span className="text-xs font-semibold uppercase text-[#6D6997] dark:text-slate-400">
                            Age range <span className="text-rose-500">*</span>
                        </span>
                        <select
                            className="mt-1 min-h-10 w-full rounded-xl border border-[#DCD7EA] bg-white px-3 text-sm font-medium text-[#0E0B55] outline-none focus:border-[#534AB7] focus:ring-4 focus:ring-[#E8E3FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-brand-400 dark:focus:ring-slate-800"
                            value={draft.ageRangeId}
                            onChange={event => onAgeRangeChange(event.target.value)}
                        >
                            {ageRanges.map(range => (
                                <option key={range.id} value={range.id}>
                                    {range.short_label || range.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-xs font-semibold uppercase text-[#6D6997] dark:text-slate-400">
                            Language <span className="text-rose-500">*</span>
                        </span>
                        <select
                            className="mt-1 min-h-10 w-full rounded-xl border border-[#DCD7EA] bg-white px-3 text-sm font-medium text-[#0E0B55] outline-none focus:border-[#534AB7] focus:ring-4 focus:ring-[#E8E3FF] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-brand-400 dark:focus:ring-slate-800"
                            value={draft.locale}
                            onChange={event => onChange({ ...draft, locale: event.target.value })}
                        >
                            <option value="en">English</option>
                            <option value="km">Khmer</option>
                        </select>
                    </label>
                </div>
                <div className="mt-5 flex justify-end">
                    <Button
                        loading={busy}
                        loadingText="Creating..."
                        type="submit"
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                        Create kid profile
                    </Button>
                </div>
            </div>
        </form>
    );
}

function KidLoginStep({
    busy,
    child,
    onBack,
    onLogin,
    subject,
}: {
    busy: boolean;
    child: ChildProfile;
    onBack: () => void;
    onLogin: () => void;
    subject: SubjectItem;
}) {
    return (
        <div className="space-y-5">
            <StepHeader
                icon={<LogIn className="h-5 w-5" />}
                title="Kid profile login"
                body="Hand the device to the kid and let them continue with their own profile."
            />
            <div className="rounded-3xl border border-[#E7E2F6] bg-white p-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#F2EEFF] text-2xl font-semibold text-[#534AB7] dark:bg-brand-400/15 dark:text-brand-200">
                    {getInitials(child.display_name)}
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-[#0E0B55] dark:text-white">{child.display_name}</h3>
                <p className="mt-2 text-sm font-medium text-[#6D6997] dark:text-slate-400">
                    Placement will start with {subject.label}.
                </p>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                    <Button disabled={busy} variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>
                        Add another kid
                    </Button>
                    <Button loading={busy} loadingText="Logging in..." rightIcon={<ArrowRight className="h-4 w-4" />} onClick={onLogin}>
                        Log in as {child.display_name}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function IntroStep({
    busy,
    childName,
    onBack,
    onStart,
    subject,
}: {
    busy: boolean;
    childName: string;
    onBack: () => void;
    onStart: () => void;
    subject: SubjectItem;
}) {
    return (
        <div className="rounded-3xl border border-[#E7E2F6] bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#F2EEFF] text-[#5B52C6] dark:bg-brand-400/15 dark:text-brand-200">
                <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="mt-5 text-3xl font-semibold">Hi {childName || 'there'}</h2>
            <p className="mx-auto mt-3 max-w-md text-base font-medium leading-7 text-[#6D6997] dark:text-slate-400">
                Let's do a quick {subject.label.toLowerCase()} check so Koda can start you in the right place.
            </p>
            <div className={`mx-auto mt-5 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${subjectAccent(subject.id)}`}>
                {subject.label} placement
            </div>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                <Button disabled={busy} variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>
                    Back
                </Button>
                <Button loading={busy} size="lg" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={onStart}>
                    Start
                </Button>
            </div>
            <p className="mt-5 text-sm font-medium text-[#8D89AE] dark:text-slate-500">Parent can help if needed.</p>
        </div>
    );
}

function QuestionStep({
    busy,
    onAnswer,
    progress,
    question,
    questionIndex,
    subject,
    total,
}: {
    busy: boolean;
    onAnswer: (value: string | number) => void;
    progress: number;
    question: PlacementQuestion;
    questionIndex: number;
    subject: SubjectItem;
    total: number;
}) {
    return (
        <div className="rounded-3xl border border-[#E7E2F6] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[#5B52C6] dark:text-brand-200">{subject.label} check</p>
                    <h2 className="mt-1 text-2xl font-semibold">{question.prompt}</h2>
                </div>
                <span className="rounded-full bg-[#F2EEFF] px-3 py-1 text-sm font-semibold text-[#5B52C6] dark:bg-brand-400/15 dark:text-brand-200">
                    {questionIndex + 1} of {total}
                </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#ECE8FA] dark:bg-slate-800">
                <div className="h-full rounded-full bg-[#5B52C6] transition-all dark:bg-brand-400" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {question.choices.map(choice => (
                    <button
                        key={String(choice)}
                        disabled={busy}
                        type="button"
                        className="min-h-16 rounded-2xl border border-[#DCD7EA] bg-white px-4 text-xl font-semibold text-[#0E0B55] shadow-sm transition hover:border-[#BDB4F4] hover:bg-[#F7F4FF] focus:border-[#5B52C6] focus:outline-none focus:ring-4 focus:ring-[#E8E3FF] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:border-brand-400 dark:hover:bg-slate-800 dark:focus:border-brand-400 dark:focus:ring-slate-800"
                        onClick={() => onAnswer(choice)}
                    >
                        {choice}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ResultStep({
    childName,
    onAddAnother,
    onDashboard,
    result,
    subject,
}: {
    childName: string;
    onAddAnother: () => void;
    onDashboard: () => void;
    result: PlacementResultSummary | null;
    subject?: SubjectItem;
}) {
    return (
        <div className="rounded-3xl border border-[#E7E2F6] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                        <Check className="h-4 w-4" />
                        Ready
                    </div>
                    <h2 className="mt-4 text-3xl font-semibold">{childName || 'Child'} is ready</h2>
                    <p className="mt-2 max-w-xl text-base font-medium leading-7 text-[#6D6997] dark:text-slate-400">
                        {result?.parent_summary ?? 'Start with a short foundation path and adjust after the next lesson.'}
                    </p>
                </div>
                {subject && (
                    <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${subjectAccent(subject.id)}`}>
                        {subject.label}
                    </div>
                )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <ResultMetric label="Band" value={bandLabel(result?.band ?? 'ready')} />
                <ResultMetric label="Accuracy" value={`${Math.round((result?.accuracy ?? 0) * 100)}%`} />
                <ResultMetric label="Next step" value="First activity" />
            </div>

            <div className="mt-6 rounded-2xl border border-[#E7E2F6] bg-[#FBFAFF] p-4 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-sm font-semibold uppercase text-[#6D6997] dark:text-slate-400">Recommended first skills</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {(result?.recommended_skill_ids ?? []).map(skill => (
                        <span
                            key={skill}
                            className="rounded-full border border-[#DCD7EA] bg-white px-3 py-1.5 text-sm font-semibold text-[#5B52C6] dark:border-slate-700 dark:bg-slate-900 dark:text-brand-200"
                        >
                            {skill}
                        </span>
                    ))}
                    {(result?.recommended_skill_ids.length ?? 0) === 0 && (
                        <span className="text-sm font-medium text-[#6D6997] dark:text-slate-400">No skills assigned yet.</span>
                    )}
                </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={onAddAnother}>
                    Add another child
                </Button>
                <Button rightIcon={<ArrowRight className="h-4 w-4" />} onClick={onDashboard}>
                    Go to dashboard
                </Button>
            </div>
        </div>
    );
}

function StepHeader({ body, icon, title }: { body: string; icon: React.ReactNode; title: string }) {
    return (
        <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F2EEFF] px-3 py-1.5 text-sm font-semibold text-[#5B52C6] dark:bg-brand-400/15 dark:text-brand-200">
                {icon}
                Onboarding
            </div>
            <h2 className="mt-4 text-3xl font-semibold">{title}</h2>
            <p className="mt-2 max-w-2xl text-base font-medium leading-7 text-[#6D6997] dark:text-slate-400">{body}</p>
        </div>
    );
}

function LoadingCard({ title = 'Loading onboarding' }: { title?: string }) {
    return (
        <div className="rounded-3xl border border-[#E7E2F6] bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="h-5 w-48 rounded bg-[#F2EEFF] dark:bg-slate-800" />
            <div className="mt-4 h-12 rounded-2xl bg-[#FBFAFF] dark:bg-slate-950" />
            <div className="mt-3 h-12 rounded-2xl bg-[#FBFAFF] dark:bg-slate-950" />
            <p className="mt-4 text-sm font-semibold text-[#6D6997] dark:text-slate-400">{title}...</p>
        </div>
    );
}

function EmptyCatalogCard() {
    return (
        <div className="rounded-3xl border border-[#E7E2F6] bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-[#0E0B55] dark:text-white">Learning catalog is empty</h2>
            <p className="mt-2 text-sm font-medium text-[#6D6997] dark:text-slate-400">
                Add subjects and age ranges in admin before parents onboard children.
            </p>
        </div>
    );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-[#E7E2F6] bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs font-semibold uppercase text-[#6D6997] dark:text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-semibold text-[#0E0B55] dark:text-white">{value}</p>
        </div>
    );
}

function initializeDraft(current: ChildDraft, data: ParentOnboardingState | null): ChildDraft {
    if (current.ageRangeId && current.subjectIds.length > 0) return current;
    const ageRange = data?.catalog.age_ranges.find(item => item.enabled);
    const subjectIds = ageRange?.subject_ids.filter(id =>
        data?.catalog.subjects.some(subject => subject.id === id && subject.enabled),
    ) ?? [];
    return {
        ...current,
        ageRangeId: ageRange?.id ?? '',
        subjectIds,
        primarySubjectId: subjectIds[0] ?? '',
    };
}

function stepIndex(step: Step) {
    return STEP_ORDER.indexOf(step);
}

function getInitials(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'K';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function subjectAccent(subjectId: string) {
    if (subjectId === 'math') return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/20';
    if (subjectId === 'reading') return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:border-violet-400/20';
    if (subjectId === 'science') return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/20';
    return 'bg-[#F2EEFF] text-[#534AB7] border-[#DCD7EA] dark:bg-brand-400/15 dark:text-brand-200 dark:border-brand-400/20';
}

function bandLabel(band: PlacementBand) {
    if (band === 'review') return 'Review';
    if (band === 'stretch') return 'Stretch';
    return 'Ready';
}
