import type { Locale } from '@/lib/i18n';

export function LocaleSwitcher({
    locale,
    onChange,
    options = ['en', 'km'],
}: {
    locale: Locale;
    onChange: (next: Locale) => void;
    options?: Locale[];
}) {
    return (
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {options.map(option => {
                const active = locale === option;
                return (
                    <button
                        key={option}
                        className={`min-h-10 rounded-xl px-3 text-xs font-bold transition ${
                            active
                                ? 'bg-brand-500 text-white shadow-sm dark:bg-brand-400 dark:text-slate-950'
                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                        type="button"
                        onClick={() => onChange(option)}
                    >
                        {option.toUpperCase()}
                    </button>
                );
            })}
        </div>
    );
}
