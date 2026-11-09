import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'

/** Stand-in for a screen that is not built yet: translated title and a TODO. */
export function PlaceholderPage({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <PageHeader title={t(titleKey)} />
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">{t('common.todo')}</CardContent>
      </Card>
    </div>
  )
}
