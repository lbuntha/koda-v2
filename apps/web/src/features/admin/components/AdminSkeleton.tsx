export function AdminLayoutSkeleton() {
    return (
        <div className="flex min-h-screen flex-col bg-[#FBFAFF] text-[#0E0B55] transition-colors duration-300 dark:bg-[#0B1120] dark:text-white md:flex-row">
            <aside className="border-b border-[#E7E2F6] bg-white/80 px-5 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:min-h-screen md:w-72 md:border-b-0 md:border-r">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl koda-admin-skeleton" />
                    <div className="space-y-2">
                        <div className="h-4 w-24 rounded-full koda-admin-skeleton" />
                        <div className="h-3 w-32 rounded-full koda-admin-skeleton" />
                    </div>
                </div>

                <div className="mt-8 space-y-2">
                    {Array.from({ length: 7 }).map((_, index) => (
                        <div key={index} className="flex h-11 items-center gap-3 rounded-2xl px-3">
                            <div className="h-5 w-5 rounded-lg koda-admin-skeleton" />
                            <div className="h-4 flex-1 rounded-full koda-admin-skeleton" />
                        </div>
                    ))}
                </div>

                <div className="mt-8 rounded-2xl border border-[#E7E2F6] bg-[#FBFAFF] p-3 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full koda-admin-skeleton" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 rounded-full koda-admin-skeleton" />
                            <div className="h-3 w-32 rounded-full koda-admin-skeleton" />
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 px-5 py-6 sm:px-8 lg:px-10">
                <div className="mb-6 flex items-center justify-end">
                    <div className="h-10 w-28 rounded-full koda-admin-skeleton" />
                </div>
                <AdminPageSkeleton rows={5} />
            </main>
        </div>
    );
}

export function AdminPageSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <section className="max-w-5xl">
            <div className="mb-6">
                <div className="h-4 w-28 rounded-full koda-admin-skeleton" />
                <div className="mt-3 h-9 w-72 rounded-full koda-admin-skeleton" />
                <div className="mt-3 h-4 w-full max-w-xl rounded-full koda-admin-skeleton" />
            </div>
            <div className="rounded-2xl border border-[#E7E2F6] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="space-y-3">
                    {Array.from({ length: rows }).map((_, index) => (
                        <div key={index} className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
                            <div className="h-12 rounded-2xl koda-admin-skeleton" />
                            <div className="h-12 rounded-2xl koda-admin-skeleton" />
                            <div className="h-12 rounded-2xl koda-admin-skeleton" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
