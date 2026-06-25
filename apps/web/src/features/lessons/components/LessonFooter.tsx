import type { LessonPhase } from '../hooks/useLessonEngine';

interface Props {
    phase: LessonPhase;
    canAdvance: boolean;
    isLast: boolean;
    onAdvance: () => void;
}

export function LessonFooter({ phase, canAdvance, isLast, onAdvance }: Props) {
    const submitting = phase === 'submitting';
    const label = submitting ? 'Submitting…' : isLast ? 'Finish' : 'Continue';
    return (
        <footer className="flex items-center justify-end gap-3 pt-2">
            <button
                type="button"
                onClick={onAdvance}
                disabled={!canAdvance || submitting}
                className="rounded-2xl bg-brand-500 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {label}
            </button>
        </footer>
    );
}
