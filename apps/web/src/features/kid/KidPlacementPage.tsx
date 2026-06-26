import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import type { PlacementQuestion, PlacementSession } from '@koda/contracts';
import type { KidOutletContext } from './KidLayout';
import {
    answerKidPlacementQuestion,
    completeKidPlacementSession,
    createKidPlacementSession,
    getNextKidPlacementQuestion,
} from '@/lib/api';
import { Button } from '@/shared/ui';
import { AdminPageLayout } from '@/features/admin/components/AdminPageLayout';

const QUESTION_TOTAL_FALLBACK = 6;

export default function KidPlacementPage() {
    const navigate = useNavigate();
    const { child, childToken } = useOutletContext<KidOutletContext>();
    const [placementSession, setPlacementSession] = useState<PlacementSession | null>(null);
    const [question, setQuestion] = useState<PlacementQuestion | null>(null);
    const [mode, setMode] = useState<'intro' | 'questions' | 'result'>('intro');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const answeredCount = placementSession?.answers.length ?? 0;
    const questionNumber = Math.min(answeredCount + 1, QUESTION_TOTAL_FALLBACK);
    const progress = mode === 'questions' ? (questionNumber / QUESTION_TOTAL_FALLBACK) * 100 : 0;
    const subjectLabel = useMemo(() => {
        const subjectId = placementSession?.subject_id ?? child?.primary_subject_id ?? 'placement';
        return subjectId.charAt(0).toUpperCase() + subjectId.slice(1);
    }, [child?.primary_subject_id, placementSession?.subject_id]);

    async function startPlacement() {
        setBusy(true);
        setError(null);
        try {
            const session = await createKidPlacementSession(childToken);
            const nextQuestion = await getNextKidPlacementQuestion(childToken, session._id);
            setPlacementSession(session);
            setQuestion(nextQuestion);
            setMode(nextQuestion ? 'questions' : 'result');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    }

    async function answer(value: string | number) {
        if (!placementSession || !question) return;
        setBusy(true);
        setError(null);
        try {
            const answered = await answerKidPlacementQuestion(childToken, placementSession._id, {
                question_id: question.id,
                selected_value: value,
            });
            const nextQuestion = await getNextKidPlacementQuestion(childToken, placementSession._id);
            if (nextQuestion) {
                setPlacementSession(answered);
                setQuestion(nextQuestion);
                return;
            }
            const completed = await completeKidPlacementSession(childToken, placementSession._id);
            setPlacementSession(completed);
            setQuestion(null);
            setMode('result');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusy(false);
        }
    }

    function finish() {
        navigate('/kid', { replace: true });
    }

    return (
        <AdminPageLayout
            className="max-w-4xl"
            description="Complete this short check so Koda can start you in the right place."
            title="Placement"
        >
            <div className="mx-auto flex max-w-3xl items-center justify-center">
                <section className="w-full rounded-3xl border border-[#E5DFF8] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                    {error && (
                        <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                            {error}
                        </p>
                    )}

                    {mode === 'intro' && (
                        <div className="text-center">
                            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#F2EEFF] text-2xl font-semibold text-[#534AB7] dark:bg-brand-400/15 dark:text-brand-200">
                                {getInitials(child.display_name)}
                            </div>
                            <h1 className="mt-5 text-3xl font-semibold">Hi {child.display_name}</h1>
                            <p className="mx-auto mt-3 max-w-md text-base font-medium leading-7 text-[#6D6997] dark:text-slate-400">
                                You are now using your kid profile. Start this quick check so Koda can pick the right activities.
                            </p>
                            <Button
                                className="mt-7"
                                loading={busy}
                                rightIcon={<ArrowRight className="h-4 w-4" />}
                                size="lg"
                                onClick={startPlacement}
                            >
                                Start placement
                            </Button>
                        </div>
                    )}

                    {mode === 'questions' && question && (
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="inline-flex items-center gap-2 rounded-full bg-[#F2EEFF] px-3 py-1 text-sm font-semibold text-[#534AB7] dark:bg-brand-400/15 dark:text-brand-200">
                                        <Sparkles className="h-4 w-4" />
                                        {subjectLabel} check
                                    </p>
                                    <h1 className="mt-4 text-2xl font-semibold">{question.prompt}</h1>
                                </div>
                                <span className="rounded-full bg-[#F2EEFF] px-3 py-1 text-sm font-semibold text-[#534AB7] dark:bg-brand-400/15 dark:text-brand-200">
                                    {questionNumber} of {QUESTION_TOTAL_FALLBACK}
                                </span>
                            </div>
                            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#ECE8FA] dark:bg-slate-800">
                                <div className="h-full rounded-full bg-[#534AB7] dark:bg-brand-400" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                {question.choices.map(choice => (
                                    <button
                                        key={String(choice)}
                                        className="min-h-16 rounded-2xl border border-[#DCD7EA] bg-white px-4 text-xl font-semibold text-[#0E0B55] shadow-sm transition hover:border-[#BDB4F4] hover:bg-[#F7F4FF] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:border-brand-400 dark:hover:bg-slate-800"
                                        disabled={busy}
                                        type="button"
                                        onClick={() => answer(choice)}
                                    >
                                        {choice}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {mode === 'result' && (
                        <div className="text-center">
                            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                                <Check className="h-8 w-8" />
                            </div>
                            <h1 className="mt-5 text-3xl font-semibold">Placement complete</h1>
                            <p className="mx-auto mt-3 max-w-md text-base font-medium leading-7 text-[#6D6997] dark:text-slate-400">
                                {placementSession?.result?.parent_summary ?? 'Your learning path is ready.'}
                            </p>
                            <Button className="mt-7" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={finish}>
                                Go to my home
                            </Button>
                        </div>
                    )}
                </section>
            </div>
        </AdminPageLayout>
    );
}

function getInitials(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'K';
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
