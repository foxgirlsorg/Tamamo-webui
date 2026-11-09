// Advanced & CSS tab: the custom CSS box and the list of things it can target
// (legacy designerPanel "css"). The backend rejects "<" and "credit" in CSS, so
// they are flagged here as well.

import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { TextArea } from './controls'
import { useDesigner } from './designer-store'
import { CSS_TARGETS } from './page-model'

export function AdvancedTab() {
  const { t } = useTranslation()
  const { page, edit } = useDesigner()

  const css = page.custom_css ?? ''
  const lower = css.toLowerCase()
  const cssError = lower.includes('<') ? t('page.css.errLt') : lower.includes('credit') ? t('page.css.errCredit') : undefined

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('page.tab.css')}</CardTitle>
          <CardDescription>{t('page.css.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <TextArea
            id="custom-css"
            label={t('page.tab.css')}
            rows={14}
            mono
            value={css}
            help={t('page.css.help')}
            error={cssError}
            onChange={(v) => edit((p) => { p.custom_css = v })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('page.css.targets')}</CardTitle>
          <CardDescription>{t('page.css.targetsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {CSS_TARGETS.map(([selector, key]) => (
            <div key={selector} className="grid gap-0.5 rounded-md border p-2.5">
              <code className="font-mono text-xs break-all">{selector}</code>
              <span className="text-xs text-muted-foreground">{t(`cssTarget.${key}`)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
