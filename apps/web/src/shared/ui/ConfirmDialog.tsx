import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function ConfirmDialog({
    body,
    cancelLabel = 'Cancel',
    confirmLabel = 'Confirm',
    destructive = false,
    onCancel,
    onConfirm,
    open,
    title,
}: {
    body?: ReactNode;
    cancelLabel?: string;
    confirmLabel?: string;
    destructive?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    open: boolean;
    title: string;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <section
                aria-modal="true"
                className="w-full max-w-md rounded-2xl border border-[#E7E2F6] bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                role="dialog"
            >
                <div className="flex gap-3">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${destructive ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-[#F2EEFF] text-[#534AB7] dark:bg-slate-800 dark:text-white'}`}>
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-[#0E0B55] dark:text-white">{title}</h2>
                        {body && <div className="mt-2 text-sm leading-6 text-[#6D6997] dark:text-slate-300">{body}</div>}
                    </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        {cancelLabel}
                    </Button>
                    <Button variant={destructive ? 'destructive' : 'primary'} onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </div>
            </section>
        </div>
    );
}
