import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SkillRunner } from '@/features/skills/SkillRunner';
import { LessonFooter } from './components/LessonFooter';
import { LessonHeader } from './components/LessonHeader';
import { LessonResults } from './LessonResults';
import { useLessonEngine } from './hooks/useLessonEngine';
import { useLessonPersistence } from './hooks/useLessonPersistence';
import type { LessonResult, LessonSkill } from './types';

interface Props {
    skill: LessonSkill;
    childProfileId: string;
    onExit(): void;
}

function newAttemptId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return `att_${crypto.randomUUID().replace(/-/g, '')}`;
    }
    return `att_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function LessonHost({ skill, childProfileId, onExit }: Props) {
    const engine = useLessonEngine(skill);
    const persist = useLessonPersistence();
    const [result, setResult] = useState<LessonResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [attemptId, setAttemptId] = useState<string>(() => newAttemptId());
    const submittingRef = useRef(false);

    const isLast = engine.questionIdx === engine.totalQuestions - 1;

    const handleSubmit = useCallback(async () => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        try {
            const submitted = await persist({
                clientAttemptId: attemptId,
                childProfileId,
                skillId: skill.id,
                answers: engine.serializedAnswers(),
                startedAt: engine.startedAt,
            });
            setResult(submitted);
            engine.setPhase('done');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            engine.setPhase('asking');
        } finally {
            submittingRef.current = false;
        }
    }, [attemptId, childProfileId, engine, persist, skill.id]);

    useEffect(() => {
        if (engine.phase === 'submitting' && !result) {
            void handleSubmit();
        }
    }, [engine.phase, handleSubmit, result]);

    const onAdvance = () => {
        setError(null);
        engine.advance();
    };

    const onRetry = () => {
        setResult(null);
        setError(null);
        setAttemptId(newAttemptId());
        engine.setPhase('asking');
    };

    const content = useMemo(() => {
        if (engine.phase === 'done' && result) {
            return <LessonResults result={result} skillTitle={skill.title} onClose={onExit} onRetry={onRetry} />;
        }
        if (!engine.currentQuestion) {
            return <p className="text-center text-sm text-slate-500">No questions in this lesson yet.</p>;
        }
        return (
            <SkillRunner
                question={engine.currentQuestion}
                value={engine.currentAnswer}
                onChange={engine.setAnswer}
                disabled={engine.phase !== 'asking'}
            />
        );
    }, [engine.currentAnswer, engine.currentQuestion, engine.phase, engine.setAnswer, onExit, result, skill.title]);

    return (
        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <LessonHeader
                title={skill.title}
                progressPct={engine.progressPct}
                questionIdx={engine.questionIdx}
                totalQuestions={engine.totalQuestions}
                onExit={onExit}
            />
            {content}
            {engine.phase !== 'done' && (
                <LessonFooter
                    phase={engine.phase}
                    canAdvance={engine.canAdvance}
                    isLast={isLast}
                    onAdvance={onAdvance}
                />
            )}
            {error && (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>
            )}
        </section>
    );
}
