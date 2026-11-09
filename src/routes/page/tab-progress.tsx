// Progress & behavior tab: progress indicator, what it shows, timing and
// animations (legacy designerPanel "progress"). Changing these restarts the
// preview on the checking state, as the legacy UI did.

import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Page } from '@/lib/types'

import { NumberInput, RadioCards, SwitchRow } from './controls'
import { useDesigner } from './designer-store'

const PROGRESS: Page['progress'][] = ['bar', 'ring', 'dots', 'spinner', 'none']

export function ProgressTab() {
  const { t } = useTranslation()
  const { page, edit, setPreviewState } = useDesigner()
  const showChecking = () => setPreviewState('checking')

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('page.progress.title')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <RadioCards<Page['progress']>
            id="progress"
            label={t('page.progress.label')}
            value={page.progress}
            onChange={(v) => {
              edit((p) => { p.progress = v })
              showChecking()
            }}
            options={PROGRESS.map((v) => ({ value: v, title: t(`page.progress.${v}`) }))}
          />
          <div>
            <SwitchRow
              id="show-difficulty"
              label={t('page.progress.difficulty')}
              checked={page.show_difficulty}
              onCheckedChange={(v) => { edit((p) => { p.show_difficulty = v }); showChecking() }}
            />
            <SwitchRow
              id="show-hash-rate"
              label={t('page.progress.rate')}
              desc={t('page.progress.rateDesc')}
              checked={page.show_hash_rate}
              onCheckedChange={(v) => { edit((p) => { p.show_hash_rate = v }); showChecking() }}
            />
            <SwitchRow
              id="show-elapsed"
              label={t('page.progress.elapsed')}
              checked={page.show_elapsed}
              onCheckedChange={(v) => { edit((p) => { p.show_elapsed = v }); showChecking() }}
            />
            <SwitchRow
              id="show-percent"
              label={t('page.progress.percent')}
              desc={t('page.progress.percentDesc')}
              checked={page.show_percent}
              onCheckedChange={(v) => { edit((p) => { p.show_percent = v }); showChecking() }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('page.timing.title')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberInput
              id="min-display-ms"
              label={t('page.timing.min')}
              value={page.min_display_ms}
              min={0}
              max={15000}
              step={100}
              suffix={t('unit.ms')}
              help={t('page.timing.minHelp')}
              onChange={(v) => edit((p) => { p.min_display_ms = v })}
            />
            <NumberInput
              id="success-delay-ms"
              label={t('page.timing.delay')}
              value={page.success_delay_ms}
              min={0}
              max={15000}
              step={100}
              suffix={t('unit.ms')}
              help={t('page.timing.delayHelp')}
              onChange={(v) => edit((p) => { p.success_delay_ms = v })}
            />
          </div>
          <div>
            <SwitchRow
              id="auto-redirect"
              label={t('page.timing.auto')}
              desc={t('page.timing.autoDesc')}
              checked={page.auto_redirect}
              onCheckedChange={(v) => edit((p) => { p.auto_redirect = v })}
            />
            <SwitchRow
              id="animations"
              label={t('page.timing.animations')}
              desc={t('page.timing.animationsDesc')}
              checked={page.animations}
              onCheckedChange={(v) => edit((p) => { p.animations = v })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
