import type { Locale } from '@/lib/i18n';

export function LocaleSwitcher({
    label = 'Language',
    locale,
    onChange,
    options = ['en', 'km'],
}: {
    label?: string;
    locale: Locale;
    onChange: (next: Locale) => void;
    options?: Locale[];
}) {
    return (
        <label className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#E7E2F6] bg-white px-3 text-sm font-medium text-[#6D6997] shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            {label && <span>{label}</span>}
            <select
                className="bg-transparent text-sm font-semibold text-[#0E0B55] outline-none dark:text-white"
                value={locale}
                onChange={event => onChange(event.target.value as Locale)}
            >
                {options.map(option => (
                    <option key={option} value={option}>
                        {option.toUpperCase()}
                    </option>
                ))}
            </select>
        </label>
    );
}
