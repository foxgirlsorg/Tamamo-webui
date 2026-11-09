import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LANGUAGES, setLanguage } from '@/lib/i18n'

/** Settings → Interface: the only place that changes the UI language. */
export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const selectId = 'interface-language'

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.settings')} description={t('settings.desc')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.interface')}</CardTitle>
          <CardDescription>{t('settings.interfaceDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor={selectId}>{t('lang.label')}</Label>
          <Select value={i18n.language} onValueChange={(code) => void setLanguage(code)}>
            <SelectTrigger id={selectId} className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} lang={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  )
}
