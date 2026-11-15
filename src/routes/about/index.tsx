import { Trans, useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppState } from '@/lib/auth'

const SETTINGS_FILE = 'data/tamamo.yaml'
const MASCOT_POSES = ['checking', 'success', 'denied'] as const
const SITE_URL = 'https://foxgirls.org'
const ARTIST_URL = 'https://t.me/tr1flu0r1d3_exe_art'
const LINK_CLASS = 'text-primary underline-offset-4 hover:underline'

/** Version, the settings file, credits (foxgirls.org, mascot art) and the mascot Eru. */
export function AboutPage() {
  const { t } = useTranslation()
  const { data: state } = useAppState()
  const version = state?.version ? state.version.replace(/^v/, '') : ''

  const siteLink = (
    <a href={SITE_URL} target="_blank" rel="noreferrer" className={LINK_CLASS} />
  )
  const artistLink = (
    <a href={ARTIST_URL} target="_blank" rel="noreferrer" className={LINK_CLASS} />
  )

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.about')} />

      <Card>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <img
            src="/assets/mascot/checking.png"
            alt={t('about.mascotAlt')}
            width={112}
            height={112}
            className="size-28 shrink-0"
          />
          <div className="max-w-prose space-y-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Tamamo</h2>
              <p className="text-sm text-muted-foreground">
                <Trans i18nKey="about.by" components={{ site: siteLink }} />
              </p>
            </div>
            <p className="text-sm">{t('about.intro')}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{version ? t('about.version', { v: version }) : t('about.devBuild')}</Badge>
              <Badge variant="secondary">{t('about.noTelemetry')}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('about.settingsTitle')}</CardTitle>
          <CardDescription>{t('about.settingsDesc', { file: SETTINGS_FILE })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.8125rem]">{SETTINGS_FILE}</code>
          </p>
          <p className="text-muted-foreground">{t('about.webuiNote')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('about.credits')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <Trans i18nKey="about.creditsDev" components={{ site: siteLink }} />
          </p>
          <p>
            <Trans i18nKey="about.creditsArt" components={{ artist: artistLink }} />
          </p>
          <p className="text-muted-foreground">{t('about.creditsIcons')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('about.mascot')}</CardTitle>
          <CardDescription>
            <Trans i18nKey="about.mascotDesc" components={{ site: siteLink }} />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-8">
          {MASCOT_POSES.map((pose) => (
            <figure key={pose} className="space-y-2 text-center">
              <img
                src={`/assets/mascot/${pose}.png`}
                alt={t(`about.pose.${pose}`)}
                width={96}
                height={96}
                loading="lazy"
                className="mx-auto size-24"
              />
              <figcaption className="text-xs text-muted-foreground">{t(`page.state.${pose}`)}</figcaption>
            </figure>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
