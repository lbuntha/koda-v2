import { useOutletContext } from 'react-router-dom';
import { ArrowRight, BookOpen, Sparkles, Trophy } from 'lucide-react';
import type { KidOutletContext } from './KidLayout';
import { AdminPageLayout } from '@/features/admin/components/AdminPageLayout';

export default function KidHomePage() {
    const { child } = useOutletContext<KidOutletContext>();

    return (
        <AdminPageLayout
            className="max-w-5xl"
            description="Start your recommended activity and keep practicing."
            title={`Hi, ${child.display_name}`}
        >
                <section className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                    <div className="rounded-3xl border border-[#E5DFF8] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                            <Sparkles className="h-4 w-4" />
                            Ready to learn
                        </div>
                        <h2 className="mt-5 text-3xl font-semibold">Your learning path is ready</h2>
                        <p className="mt-3 max-w-xl text-base font-medium leading-7 text-[#6D6997] dark:text-slate-400">
                            Start with your first recommended activity. Koda will keep adjusting as you practice.
                        </p>
                        <button
                            className="mt-7 flex min-h-20 w-full items-center justify-between rounded-3xl border border-[#DCD7EA] bg-[#F8F5FF] px-5 text-left transition hover:border-[#BDB4F4] hover:bg-[#F2EEFF] dark:border-slate-700 dark:bg-slate-950 dark:hover:border-brand-400 dark:hover:bg-slate-800"
                            type="button"
                        >
                            <span className="flex items-center gap-3">
                                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#534AB7] shadow-sm dark:bg-brand-400/15 dark:text-brand-200">
                                    <BookOpen className="h-5 w-5" />
                                </span>
                                <span>
                                    <span className="block font-semibold">First activity</span>
                                    <span className="mt-1 block text-sm font-medium text-[#6D6997] dark:text-slate-400">
                                        Begin your recommended practice.
                                    </span>
                                </span>
                            </span>
                            <ArrowRight className="h-5 w-5 text-[#534AB7] dark:text-brand-200" />
                        </button>
                    </div>

                    <aside className="rounded-3xl border border-[#E5DFF8] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <h2 className="mt-4 text-xl font-semibold">Today</h2>
                        <div className="mt-4 space-y-3">
                            <KidStat label="Placement" value="Complete" />
                            <KidStat label="Daily goal" value="0 / 3" />
                            <KidStat label="XP" value="0" />
                        </div>
                    </aside>
                </section>
        </AdminPageLayout>
    );
}

function KidStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-[#EEEAF9] bg-[#FBFAFF] px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
            <span className="text-sm font-medium text-[#6D6997] dark:text-slate-400">{label}</span>
            <span className="text-sm font-semibold text-[#0E0B55] dark:text-white">{value}</span>
        </div>
    );
}
