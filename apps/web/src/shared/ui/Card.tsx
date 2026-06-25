import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    padded?: boolean;
}

export function Card({ children, className = '', padded = true, ...rest }: CardProps) {
    return (
        <div
            className={`rounded-2xl border border-slate-100 bg-white shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 ${
                padded ? 'p-5' : ''
            } ${className}`}
            {...rest}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`mb-3 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <h3 className={`text-lg font-black text-slate-900 dark:text-white ${className}`}>{children}</h3>
    );
}

export function CardKicker({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <p className={`text-xs font-black uppercase tracking-wide text-brand-600 dark:text-brand-400 ${className}`}>
            {children}
        </p>
    );
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
    return <div className={`text-sm leading-6 text-slate-600 dark:text-slate-300 ${className}`}>{children}</div>;
}
