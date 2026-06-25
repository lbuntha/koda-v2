import { mcqTemplate } from './mcq';
import { mathWorksheetTemplate } from './math-worksheet';
import type { SkillTemplate, TemplateId } from './types';

export const TEMPLATES: Record<TemplateId, SkillTemplate<any, any>> = {
    mcq: mcqTemplate,
    'math-worksheet': mathWorksheetTemplate,
};

export function getTemplate(id: TemplateId): SkillTemplate<any, any> | null {
    return TEMPLATES[id] ?? null;
}
