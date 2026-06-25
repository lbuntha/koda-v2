import type { LessonResult } from './types';

interface Props {
    result: LessonResult;
    skillTitle: string;
    onClose(): void;
    onRetry(): void;
}

export function LessonResults({ result, skillTitle, onClose, onRetry }: Props) {
    const accuracyPct = Math.round(result.accuracy * 100);
    const perfect = result.score === result.max_score && result.max_score > 0;

    return (
        <div className="space-y-6">
            <header className="text-center">
                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full text-3xl ${perfect ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {perfect ? '★' : '✓'}
                </div>
                <h2 className="mt-3 text-2xl font-black text-slate-900">
                    {perfect ? 'Perfect!' : 'Lesson complete'}
                </h2>
                <p className="text-sm font-semibold text-slate-500">{skillTitle}</p>
            </header>

            <div className="grid grid-cols-3 gap-3">
                <Stat label="Correct" value={`${result.score}/${result.max_score}`} />
                <Stat label="Accuracy" value={`${accuracyPct}%`} />
                <Stat label="XP earned" value={`+${result.xp_granted}`} accent />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Total XP</p>
                <p className="text-3xl font-black tabular-nums text-brand-700">{result.total_xp}</p>
                {result.xp_granted === 0 && (
                    <p className="mt-2 text-xs text-slate-500">
                        Already counted — this attempt was a retry of a previously submitted session.
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onRetry}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                    Try again
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
                >
                    Done
                </button>
            </div>
        </div>
    );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
    return (
        <div className={`rounded-2xl border p-3 text-center ${accent ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`mt-1 text-lg font-black tabular-nums ${accent ? 'text-brand-700' : 'text-slate-900'}`}>{value}</p>
        </div>
    );
}
