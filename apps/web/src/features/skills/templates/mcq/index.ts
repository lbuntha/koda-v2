import type { SkillTemplate } from '../types';
import { McqRenderer } from './Renderer';
import type { McqAnswer, McqPayload } from './types';

export const mcqTemplate: SkillTemplate<McqPayload, McqAnswer> = {
    id: 'mcq',
    labelKey: 'template.mcq',
    Renderer: McqRenderer,
    isAnswered: value => value !== null && value.value !== undefined && value.value !== '',
    serialize: value => ({ value: value.value }),
};

export type { McqAnswer, McqPayload };
