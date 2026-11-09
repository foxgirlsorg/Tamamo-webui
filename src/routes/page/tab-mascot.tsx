// Mascot & images tab: the mascot's show, position, animation, size and mirror,
// and the five uploadable images (legacy designerPanel "mascot").

import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/i18n'
import type { Page, UploadSlot } from '@/lib/types'

import { SelectField, SliderField, SwitchRow } from './controls'
import { useDesigner } from './designer-store'
import { ImageSlot } from './image-slot'

const POSITIONS: Page['mascot_position'][] = ['top', 'bottom', 'left', 'right']
const ANIMATIONS: Page['mascot_animation'][] = ['none', 'float', 'bounce', 'wiggle']
const SLOTS: UploadSlot[] = ['checking', 'success', 'denied', 'background', 'favicon']

export function MascotTab() {
  const { t } = useTranslation()
  const { page, edit } = useDesigner()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('page.tab.mascot')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SwitchRow id="mascot-show" label={t('page.mascot.show')} checked={page.mascot_show} onCheckedChange={(v) => edit((p) => { p.mascot_show = v })} />
          {page.mascot_show ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  id="mascot-position"
                  label={t('page.mascot.position')}
                  value={page.mascot_position}
                  options={POSITIONS.map((v) => ({ value: v, label: t(`page.mascot.pos.${v}`) }))}
                  onChange={(v) => edit((p) => { p.mascot_position = v as Page['mascot_position'] })}
                />
                <SelectField
                  id="mascot-animation"
                  label={t('page.mascot.animation')}
                  value={page.mascot_animation}
                  options={ANIMATIONS.map((v) => ({ value: v, label: t(`page.mascot.anim.${v}`) }))}
                  onChange={(v) => edit((p) => { p.mascot_animation = v as Page['mascot_animation'] })}
                />
              </div>
              <SliderField
                id="mascot-size"
                label={t('page.mascot.size')}
                min={48}
                max={480}
                step={4}
                value={page.mascot_size}
                format={(v) => t('unit.px', { n: formatNumber(v) })}
                onChange={(v) => edit((p) => { p.mascot_size = v })}
              />
              <SwitchRow
                id="mascot-mirror"
                label={t('page.mascot.mirror')}
                desc={t('page.mascot.mirrorDesc')}
                checked={page.mascot_mirror}
                onCheckedChange={(v) => edit((p) => { p.mascot_mirror = v })}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('page.images')}</CardTitle>
          <CardDescription>{t('page.imagesDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {SLOTS.map((slot) => (
            <ImageSlot key={slot} slot={slot} title={t(`page.slot.${slot}`)} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
