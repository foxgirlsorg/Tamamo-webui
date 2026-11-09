// Layout tab: card style, width, corners, card border and shadow, credit position
// (legacy designerPanel "layout"). The "Protected by Tamamo" credit always stays.

import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/i18n'
import type { Page } from '@/lib/types'

import { LayoutThumb } from './thumbs'
import { RadioCards, SelectField, SliderField, SwitchRow } from './controls'
import { useDesigner } from './designer-store'

const LAYOUTS: Page['layout'][] = ['card', 'split', 'minimal']
const CREDIT_ALIGNS: Page['credit_align'][] = ['left', 'center', 'right']

export function LayoutTab() {
  const { t } = useTranslation()
  const { page, edit } = useDesigner()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('page.tab.layout')}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <RadioCards<Page['layout']>
          id="layout"
          label={t('page.layout.style')}
          value={page.layout}
          onChange={(v) => edit((p) => { p.layout = v })}
          options={LAYOUTS.map((v) => ({
            value: v,
            title: t(`page.layout.${v}`),
            desc: t(`page.layout.${v}Desc`),
            thumb: <LayoutThumb kind={v} />,
          }))}
        />

        <SliderField
          id="card-width"
          label={t('page.layout.width')}
          min={320}
          max={1100}
          step={10}
          value={page.card_width}
          format={(v) => t('unit.px', { n: formatNumber(v) })}
          onChange={(v) => edit((p) => { p.card_width = v })}
        />
        <SliderField
          id="radius"
          label={t('page.layout.radius')}
          min={0}
          max={48}
          value={page.radius}
          format={(v) => t('unit.px', { n: formatNumber(v) })}
          onChange={(v) => edit((p) => { p.radius = v })}
        />

        <div>
          <SwitchRow id="card-border" label={t('page.layout.border')} checked={page.card_border} onCheckedChange={(v) => edit((p) => { p.card_border = v })} />
          <SwitchRow id="card-shadow" label={t('page.layout.shadow')} checked={page.card_shadow} onCheckedChange={(v) => edit((p) => { p.card_shadow = v })} />
        </div>

        <SelectField
          id="credit-align"
          label={t('page.creditAlign.label')}
          value={page.credit_align}
          options={CREDIT_ALIGNS.map((v) => ({ value: v, label: t(`page.creditAlign.${v}`) }))}
          onChange={(v) => edit((p) => { p.credit_align = v as Page['credit_align'] })}
        />
      </CardContent>
    </Card>
  )
}
