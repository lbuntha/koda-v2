import type { ChangeEvent } from 'react';
import type { SkillRendererProps } from '../types';
import type { MathWorksheetAnswer, MathWorksheetPayload } from './types';

export function MathWorksheetRenderer({
    question,
    value,
    onChange,
    disabled,
}: SkillRendererProps<MathWorksheetPayload, MathWorksheetAnswer>) {
    const values = value?.values ?? {};

    function handleChange(problemId: string) {
        return (event: ChangeEvent<HTMLInputElement>) => {
            const raw = event.target.value.trim();
            const parsed = raw === '' ? Number.NaN : Number(raw);
            const nextValues = { ...values };
            if (Number.isFinite(parsed)) {
                nextValues[problemId] = parsed;
            } else {
                delete nextValues[problemId];
            }
            onChange({ values: nextValues });
        };
    }

    return (
        <div className="space-y-5">
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{question.prompt}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
                {question.payload.problems.map(problem => (
                    <div
                        key={problem.id}
                        className="flex items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-4 py-3"
                    >
                        <span className="font-mono text-lg font-bold text-slate-800">
                            {problem.left} {problem.operator} {problem.right} =
                        </span>
                        <input
                            type="number"
                            inputMode="numeric"
                            disabled={disabled}
                            value={values[problem.id] ?? ''}
                            onChange={handleChange(problem.id)}
                            className="ml-3 w-20 rounded-xl border-2 border-slate-200 px-3 py-2 text-center font-mono text-lg font-bold text-slate-900 outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
