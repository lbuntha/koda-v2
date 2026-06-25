import { useOutletContext } from 'react-router-dom';
import type { AdminOutletContext } from '../AdminLayout';
import { Card, CardBody, CardHeader, CardKicker, CardTitle } from '@/shared/ui';
import { copy } from '@/lib/i18n';

export default function AdminOverview() {
    const { locale } = useOutletContext<AdminOutletContext>();
    const t = copy[locale];

    const cards = [
        { titleKey: 'cardSkillsTitle', bodyKey: 'cardSkillsBody' },
        { titleKey: 'cardUsersTitle', bodyKey: 'cardUsersBody' },
        { titleKey: 'cardAuditTitle', bodyKey: 'cardAuditBody' },
    ] as const;

    return (
        <section className="max-w-4xl">
            <header>
                <p className="text-xs font-black uppercase tracking-wide text-brand-600 dark:text-brand-400">
                    {t.adminConsole}
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {t.overviewTitle}
                </h1>
                <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">{t.overviewBody}</p>
            </header>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {cards.map(card => (
                    <Card key={card.titleKey}>
                        <CardHeader>
                            <CardKicker>{t.comingSoon}</CardKicker>
                            <CardTitle className="mt-2">{t[card.titleKey]}</CardTitle>
                        </CardHeader>
                        <CardBody>{t[card.bodyKey]}</CardBody>
                    </Card>
                ))}
            </div>
        </section>
    );
}
