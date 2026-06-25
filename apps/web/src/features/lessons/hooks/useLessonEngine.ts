import { useCallback, useMemo, useState } from 'react';

import { getTemplate } from '@/features/skills/templates/registry';
import type { LessonSkill, SubmittedAnswer } from '../types';

export type LessonPhase = 'asking' | 'submitting' | 'done';

interface State {
    phase: LessonPhase;
    questionIdx: number;
    answers: Record<string, unknown>;
    startedAt: number;
}

export interface UseLessonEngineReturn {
    phase: LessonPhase;
    questionIdx: number;
    totalQuestions: number;
    currentQuestion: LessonSkill['questions'][number] | null;
    currentAnswer: unknown;
    canAdvance: boolean;
    progressPct: number;
    setAnswer(value: unknown): void;
    advance(): void;
    setPhase(next: LessonPhase): void;
    serializedAnswers(): SubmittedAnswer[];
    startedAt: number;
}

export function useLessonEngine(skill: LessonSkill | null): UseLessonEngineReturn {
    const [state, setState] = useState<State>(() => ({
        phase: 'asking',
        questionIdx: 0,
        answers: {},
        startedAt: Date.now(),
    }));

    const totalQuestions = skill?.questions.length ?? 0;
    const currentQuestion = skill?.questions[state.questionIdx] ?? null;
    const currentAnswer = currentQuestion ? state.answers[currentQuestion.id] ?? null : null;

    const canAdvance = useMemo(() => {
        if (!currentQuestion) return false;
        const template = getTemplate(currentQuestion.template);
        if (!template) return false;
        return template.isAnswered(currentAnswer as never);
    }, [currentAnswer, currentQuestion]);

    const setAnswer = useCallback(
        (value: unknown) => {
            if (!currentQuestion) return;
            setState(prev => ({
                ...prev,
                answers: { ...prev.answers, [currentQuestion.id]: value },
            }));
        },
        [currentQuestion],
    );

    const advance = useCallback(() => {
        setState(prev => {
            const nextIdx = prev.questionIdx + 1;
            if (skill && nextIdx >= skill.questions.length) {
                return { ...prev, phase: 'submitting' };
            }
            return { ...prev, questionIdx: nextIdx };
        });
    }, [skill]);

    const setPhase = useCallback((next: LessonPhase) => {
        setState(prev => ({ ...prev, phase: next }));
    }, []);

    const serializedAnswers = useCallback((): SubmittedAnswer[] => {
        if (!skill) return [];
        const out: SubmittedAnswer[] = [];
        for (const question of skill.questions) {
            const raw = state.answers[question.id];
            const template = getTemplate(question.template);
            if (!template || raw === undefined || raw === null) continue;
            out.push({ question_id: question.id, value: template.serialize(raw as never) });
        }
        return out;
    }, [skill, state.answers]);

    const progressPct = totalQuestions > 0
        ? Math.min(100, Math.round(((state.questionIdx + (state.phase === 'done' ? 1 : 0)) / totalQuestions) * 100))
        : 0;

    return {
        phase: state.phase,
        questionIdx: state.questionIdx,
        totalQuestions,
        currentQuestion,
        currentAnswer,
        canAdvance,
        progressPct,
        setAnswer,
        advance,
        setPhase,
        serializedAnswers,
        startedAt: state.startedAt,
    };
}
