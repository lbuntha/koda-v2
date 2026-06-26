import type { ReactNode } from 'react';

export function AdminPageLayout({
    actions,
    children,
    className = '',
    description,
    kicker,
    title,
}: {
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
    description?: string;
    kicker?: string;
    title: string;
}) {
    return (
        <section className={`w-full ${className}`}>
            <header className="flex flex-wrap items-start justify-between gap-3 pr-0 lg:pr-32">
                <div className="min-w-0">
                    {kicker && <p className="koda-admin-chip uppercase text-[#534AB7]">{kicker}</p>}
                    <h1 className="koda-admin-page-title mt-1">{title}</h1>
                    {description && <p className="koda-admin-label mt-2 max-w-4xl">{description}</p>}
                </div>
                {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </header>
            <div className="mt-4">{children}</div>
        </section>
    );
}
