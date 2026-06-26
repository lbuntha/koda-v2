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
                <h1 className="koda-admin-page-title">{t.overviewTitle}</h1>
                <p className="koda-admin-label mt-3 max-w-2xl">{t.overviewBody}</p>
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
