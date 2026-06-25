import type { ReactElement } from 'react';

export type TemplateId = 'mcq' | 'math-worksheet';

export interface RenderedQuestion<TPayload = unknown> {
    id: string;
    template: TemplateId;
    prompt: string;
    payload: TPayload;
    max_score: number;
}

export type Phase = 'asking' | 'submitting' | 'done';

export interface SkillRendererProps<TPayload, TAnswer> {
    question: RenderedQuestion<TPayload>;
    value: TAnswer | null;
    onChange(value: TAnswer): void;
    disabled: boolean;
}

export interface SkillTemplate<TPayload = unknown, TAnswer = unknown> {
    id: TemplateId;
    labelKey: string;
    Renderer: (props: SkillRendererProps<TPayload, TAnswer>) => ReactElement;
    isAnswered(value: TAnswer | null): boolean;
    serialize(value: TAnswer): unknown;
}
