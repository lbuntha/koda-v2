import { AdminPageLayout } from '@/features/admin/components/AdminPageLayout';

export default function KidPlaceholderPage({ title }: { title: string }) {
    return (
        <AdminPageLayout className="max-w-4xl" description="This kid page is reserved for the next learning flow." title={title}>
            <div className="rounded-3xl border border-[#E7E2F6] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="koda-admin-section-title">Coming next</h2>
                <p className="koda-admin-label mt-2">The page route is ready for production components.</p>
            </div>
        </AdminPageLayout>
    );
}
