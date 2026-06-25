import type { SkillTemplate } from '../types';
import { MathWorksheetRenderer } from './Renderer';
import type { MathWorksheetAnswer, MathWorksheetPayload } from './types';

export const mathWorksheetTemplate: SkillTemplate<MathWorksheetPayload, MathWorksheetAnswer> = {
    id: 'math-worksheet',
    labelKey: 'template.mathWorksheet',
    Renderer: MathWorksheetRenderer,
    isAnswered: value => {
        if (!value) return false;
        const filled = Object.values(value.values).filter(v => Number.isFinite(v));
        return filled.length > 0;
    },
    serialize: value => ({ values: value.values }),
};

export type { MathWorksheetAnswer, MathWorksheetPayload, MathWorksheetProblem } from './types';
