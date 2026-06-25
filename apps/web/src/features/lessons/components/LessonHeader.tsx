interface Props {
    title: string;
    progressPct: number;
    questionIdx: number;
    totalQuestions: number;
    onExit?: () => void;
}

export function LessonHeader({ title, progressPct, questionIdx, totalQuestions, onExit }: Props) {
    return (
        <header className="space-y-3 border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-500">Lesson</p>
                    <h1 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 tabular-nums">
                        {Math.min(questionIdx + 1, totalQuestions)} / {totalQuestions}
                    </span>
                    {onExit && (
                        <button
                            type="button"
                            onClick={onExit}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                            Exit
                        </button>
                    )}
                </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                />
            </div>
        </header>
    );
}
