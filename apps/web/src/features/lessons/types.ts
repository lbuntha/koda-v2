import type { RenderedQuestion } from '@/features/skills/templates/types';

export interface LessonSkill {
    id: string;
    slug: string;
    title: string;
    description: string;
    grade: string;
    locale: string;
    status: string;
    tags: string[];
    questions: RenderedQuestion[];
}

export interface SubmittedAnswer {
    question_id: string;
    value: unknown;
}

export interface QuestionResult {
    question_id: string;
    correct: boolean;
    score: number;
    max_score: number;
}

export interface LessonResult {
    attempt_id: string;
    skill_id: string;
    score: number;
    max_score: number;
    accuracy: number;
    xp_granted: number;
    total_xp: number;
    results: QuestionResult[];
}

export interface ChildTotal {
    child_profile_id: string;
    display_name: string;
    total_xp: number;
}
