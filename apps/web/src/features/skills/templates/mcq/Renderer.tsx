import type { SkillRendererProps } from '../types';
import type { McqAnswer, McqPayload } from './types';

export function McqRenderer({ question, value, onChange, disabled }: SkillRendererProps<McqPayload, McqAnswer>) {
    return (
        <div className="space-y-5">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{question.prompt}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
                {question.payload.choices.map((choice, idx) => {
                    const selected = value !== null && String(value.value) === String(choice);
                    return (
                        <button
                            key={`${idx}-${String(choice)}`}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange({ value: choice })}
                            className={`rounded-2xl border-2 px-4 py-3 text-left text-base font-semibold transition ${
                                selected
                                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                                    : 'border-slate-200 bg-white text-slate-800 hover:border-brand-300 hover:bg-brand-50/40'
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                            {String(choice)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
