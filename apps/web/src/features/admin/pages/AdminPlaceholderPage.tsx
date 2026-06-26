import { useOutletContext } from 'react-router-dom';
import type { AdminOutletContext } from '../AdminLayout';
import { copy } from '@/lib/i18n';
import { Card, CardBody, CardHeader, CardKicker, CardTitle } from '@/shared/ui';

interface AdminPlaceholderPageProps {
    bodyKey: keyof (typeof copy)['en'];
    titleKey: keyof (typeof copy)['en'];
}

export default function AdminPlaceholderPage({ bodyKey, titleKey }: AdminPlaceholderPageProps) {
    const { locale } = useOutletContext<AdminOutletContext>();
    const t = copy[locale];

    return (
        <section className="max-w-5xl">
            <header>
                <h1 className="koda-admin-page-title">{t[titleKey]}</h1>
                <p className="koda-admin-label mt-3 max-w-2xl">{t[bodyKey]}</p>
            </header>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="border-[#E7E2F6]">
                    <CardHeader>
                        <CardKicker>{t.skeletonReady}</CardKicker>
                        <CardTitle>{t.adminScaffold}</CardTitle>
                    </CardHeader>
                    <CardBody>{t.adminScaffoldBody}</CardBody>
                    <div className="mt-5 space-y-3">
                        <SkeletonLine width="w-11/12" />
                        <SkeletonLine width="w-8/12" />
                        <SkeletonLine width="w-10/12" />
                    </div>
                </Card>
                <Card className="border-[#E7E2F6]">
                    <CardHeader>
                        <CardKicker>{t.nextStep}</CardKicker>
                        <CardTitle>{t.adminDataHook}</CardTitle>
                    </CardHeader>
                    <CardBody>{t.adminDataHookBody}</CardBody>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <SkeletonBlock />
                        <SkeletonBlock />
                    </div>
                </Card>
            </div>
        </section>
    );
}

function SkeletonLine({ width }: { width: string }) {
    return <div className={`h-4 rounded-full ${width} koda-admin-skeleton`} />;
}

function SkeletonBlock() {
    return <div className="h-20 rounded-2xl koda-admin-skeleton" />;
}
