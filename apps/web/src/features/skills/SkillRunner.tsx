import { getTemplate } from './templates/registry';
import type { RenderedQuestion } from './templates/types';

interface Props {
    question: RenderedQuestion;
    value: unknown;
    onChange(value: unknown): void;
    disabled: boolean;
}

export function SkillRunner({ question, value, onChange, disabled }: Props) {
    const template = getTemplate(question.template);
    if (!template) {
        return (
            <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
                Unsupported template: {question.template}
            </div>
        );
    }
    const Renderer = template.Renderer;
    return <Renderer question={question as RenderedQuestion<unknown>} value={value as never} onChange={onChange} disabled={disabled} />;
}
