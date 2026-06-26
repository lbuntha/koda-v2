import type { ReactNode } from 'react';

export interface TabItem<T extends string> {
    value: T;
    label: ReactNode;
    badge?: ReactNode;
}

export function Tabs<T extends string>({
    ariaLabel,
    className = '',
    items,
    onChange,
    orientation = 'horizontal',
    value,
}: {
    ariaLabel?: string;
    className?: string;
    items: TabItem<T>[];
    onChange: (value: T) => void;
    orientation?: 'horizontal' | 'vertical';
    value: T;
}) {
    const vertical = orientation === 'vertical';

    return (
        <div
            aria-label={ariaLabel}
            aria-orientation={orientation}
            className={`${vertical ? 'flex w-full flex-col overflow-y-auto' : 'inline-flex max-w-full overflow-x-auto'} gap-1 rounded-2xl border border-[#E7E2F6] bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
            role="tablist"
        >
            {items.map(item => {
                const active = item.value === value;
                return (
                    <button
                        key={item.value}
                        aria-selected={active}
                        className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                            vertical ? 'justify-start' : 'justify-center'
                        } ${
                            active
                                ? 'bg-[#F2EEFF] text-[#534AB7] shadow-sm dark:bg-slate-800 dark:text-white'
                                : 'text-[#6D6997] hover:bg-[#FBFAFF] hover:text-[#0E0B55] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                        }`}
                        role="tab"
                        type="button"
                        onClick={() => onChange(item.value)}
                    >
                        <span>{item.label}</span>
                        {item.badge !== undefined && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    active
                                        ? 'bg-white text-[#534AB7] dark:bg-slate-900 dark:text-white'
                                        : 'bg-[#F2EEFF] text-[#534AB7] dark:bg-slate-800 dark:text-slate-300'
                                }`}
                            >
                                {item.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
