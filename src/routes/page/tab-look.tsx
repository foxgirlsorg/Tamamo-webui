// Look & theme tab: color mode, presets, palettes, typography and background
// (legacy designerPanel "colors", "type" and "background").

import { useTranslation } from 'react-i18next'
import { AlertTriangle, Moon, Monitor, Sun } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/i18n'
import type { Page, ThemeMode } from '@/lib/types'

import { ColorField, RadioCards, SelectField, SliderField, TextField } from './controls'
import { useDesigner } from './designer-store'
import { ImageSlot } from './image-slot'
import { PALETTE_ROLES, THEMES, resolveTheme, type ThemeDef } from './page-model'
import { BgThumb } from './thumbs'

const SWATCH_KEYS: (keyof Page['light'])[] = ['background', 'surface', 'accent', 'text']
const FONTS: Page['font'][] = ['system', 'serif', 'rounded', 'mono', 'custom']
const WEIGHTS: number[] = [300, 400, 500, 600, 700, 800, 900]
const BACKGROUNDS: Page['background'][] = ['solid', 'dots', 'grid', 'stripes', 'image']

export function LookTab() {
  const { t } = useTranslation()
  const { page, defaults, edit, uploads } = useDesigner()

  const applyTheme = (theme: ThemeDef) => {
    const { light, dark } = resolveTheme(theme, defaults)
    edit((p) => {
      p.light = structuredClone(light)
      p.dark = structuredClone(dark)
      if (theme.extra) Object.assign(p, theme.extra)
      else if (p.font === 'mono') p.font = 'system'
    })
    const name = t(`theme.${theme.id}`)
    toast.info(t('page.presetApplied', { name }))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('page.theme')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <RadioCards<ThemeMode>
            id="theme-mode"
            label={t('page.mode.label')}
            value={page.theme_mode}
            onChange={(v) => edit((p) => { p.theme_mode = v })}
            options={[
              { value: 'auto', icon: <Monitor className="size-4" aria-hidden />, title: t('page.mode.auto'), desc: t('page.mode.autoDesc') },
              { value: 'light', icon: <Sun className="size-4" aria-hidden />, title: t('page.mode.light') },
              { value: 'dark', icon: <Moon className="size-4" aria-hidden />, title: t('page.mode.dark') },
            ]}
          />

          <div className="grid gap-2">
            <span className="text-sm font-medium">{t('page.presets')}</span>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {THEMES.map((theme) => {
                const name = t(`theme.${theme.id}`)
                const colors = resolveTheme(theme, defaults)
                return (
                  <Button
                    key={theme.id}
                    variant="outline"
                    className="h-auto flex-col items-start gap-2 p-3 text-left"
                    aria-label={t('page.applyPreset', { name })}
                    onClick={() => applyTheme(theme)}
                  >
                    <span className="font-medium">{name}</span>
                    <span className="flex gap-1" aria-hidden>
                      {SWATCH_KEYS.map((k) => (
                        <span key={`l-${k}`} className="size-4 rounded-sm border" style={{ background: colors.light[k] }} />
                      ))}
                      <span className="w-1" />
                      {SWATCH_KEYS.map((k) => (
                        <span key={`d-${k}`} className="size-4 rounded-sm border" style={{ background: colors.dark[k] }} />
                      ))}
                    </span>
                  </Button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">{t('page.presetsHelp')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('page.palettes')}</CardTitle>
          <CardDescription>{t('page.palettesDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          {(['light', 'dark'] as const).map((mode) => (
            <div key={mode} className="grid content-start gap-3">
              <h3 className="text-sm font-semibold">{t(`page.palette.${mode}`)}</h3>
              {PALETTE_ROLES.map((role) => (
                <ColorField
                  key={role}
                  id={`palette-${mode}-${role}`}
                  label={t(`palette.${role}`)}
                  value={page[mode][role]}
                  onChange={(v) => edit((p) => { p[mode][role] = v })}
                />
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('page.tab.type')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SelectField
            id="font"
            label={t('page.font.label')}
            value={page.font}
            options={FONTS.map((f) => ({ value: f, label: t(`page.font.${f}`) }))}
            onChange={(v) => edit((p) => { p.font = v as Page['font'] })}
          />
          {page.font === 'custom' ? (
            <TextField
              id="custom-font"
              label={t('page.font.customLabel')}
              value={page.custom_font}
              placeholder={'"Inter", "Helvetica Neue"'}
              help={t('page.font.customHelp')}
              onChange={(v) => edit((p) => { p.custom_font = v })}
            />
          ) : null}
          <SliderField
            id="font-scale"
            label={t('page.font.size')}
            min={70}
            max={150}
            step={5}
            value={page.font_scale}
            format={(v) => formatNumber(v / 100, { style: 'percent', maximumFractionDigits: 0 })}
            onChange={(v) => edit((p) => { p.font_scale = v })}
          />
          <SelectField
            id="heading-weight"
            label={t('page.weight.label')}
            value={String(page.heading_weight)}
            options={WEIGHTS.map((w) => ({ value: String(w), label: t('page.weight.option', { name: t(`page.weight.${w}`), n: w }) }))}
            onChange={(v) => edit((p) => { p.heading_weight = Number(v) })}
          />
          <RadioCards<Page['align']>
            id="align"
            label={t('page.align.label')}
            columns={2}
            value={page.align}
            onChange={(v) => edit((p) => { p.align = v })}
            options={[
              { value: 'center', title: t('page.align.center'), desc: t('page.align.centerDesc') },
              { value: 'left', title: t('page.align.left'), desc: t('page.align.leftDesc') },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('page.tab.background')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <RadioCards<Page['background']>
            id="background"
            label={t('page.layout.style')}
            value={page.background}
            onChange={(v) => edit((p) => { p.background = v })}
            options={BACKGROUNDS.map((v) => ({ value: v, title: t(`page.bg.${v}`), thumb: <BgThumb kind={v} /> }))}
          />
          {page.background === 'image' ? (
            <>
              {uploads.background ? null : (
                <Alert>
                  <AlertTriangle aria-hidden />
                  <AlertTitle>{t('page.bg.noImage')}</AlertTitle>
                  <AlertDescription>{t('page.bg.noImageDesc')}</AlertDescription>
                </Alert>
              )}
              <ImageSlot slot="background" title={t('page.bg.imageSlot')} />
              <SliderField
                id="bg-blur"
                label={t('page.bg.blur')}
                min={0}
                max={40}
                value={page.background_blur}
                format={(v) => t('unit.px', { n: formatNumber(v) })}
                onChange={(v) => edit((p) => { p.background_blur = v })}
              />
              <SliderField
                id="bg-dim"
                label={t('page.bg.dim')}
                min={0}
                max={90}
                value={page.background_dim}
                format={(v) => formatNumber(v / 100, { style: 'percent', maximumFractionDigits: 0 })}
                help={t('page.bg.dimHelp')}
                onChange={(v) => edit((p) => { p.background_dim = v })}
              />
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
