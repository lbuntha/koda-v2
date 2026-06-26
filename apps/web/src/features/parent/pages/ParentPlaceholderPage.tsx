import { AdminPageLayout } from '@/features/admin/components/AdminPageLayout';

interface ParentPlaceholderPageProps {
    body: string;
    title: string;
}

export default function ParentPlaceholderPage({ body, title }: ParentPlaceholderPageProps) {
    return (
        <AdminPageLayout
            className="max-w-4xl"
            description={body}
            kicker="Parent workspace"
            title={title}
        >
            <div className="mt-6 rounded-3xl border border-[#E7E2F6] bg-white p-5 shadow-sm">
                <h2 className="koda-admin-section-title">Coming next</h2>
                <p className="koda-admin-label mt-2">
                    This page is reserved so the parent sidebar has a stable production route.
                </p>
            </div>
        </AdminPageLayout>
    );
}
