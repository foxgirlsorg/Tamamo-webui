import { Folder } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModulesResponse } from '@/lib/types'

import { PAGE_FILES, slotText, withNode } from './helpers'

const FILE_KEYS = {
  'head.html': 'head',
  'body.html': 'body',
  'style.css': 'style',
  'script.js': 'script',
} as const

/** Lists the checking-page add-on folders found on disk, with how to add one (legacy pageModulesCard). */
export function PageModulesCard({ info }: { info: ModulesResponse | undefined }) {
  const { t } = useTranslation()
  const list = info?.page_modules ?? []
  const dir = (info?.modules_dir || info?.data_dir || 'data/modules').replace(/[\\/]+$/, '')

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('modules.pageTitle')}</CardTitle>
        <CardDescription>{withNode(t('modules.pageDesc', { dir: slotText }), <code className="font-mono text-xs">{`${dir}/`}</code>)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {list.length ? (
          <ul className="space-y-2">
            {list.map((pm) => (
              <li key={pm.name} className="flex flex-wrap items-center gap-2 text-sm">
                <Folder aria-hidden className="size-4 text-muted-foreground" />
                <strong className="font-medium">{pm.name}</strong>
                {pm.files.map((f) => (
                  <Badge key={f} variant="outline">
                    {f}
                  </Badge>
                ))}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t('modules.pageNone')}</p>
        )}

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{withNode(t('modules.pageHow', { path: slotText }), <code className="font-mono text-xs">{`${dir}/my-addon/`}</code>)}</p>
          <ul className="list-disc space-y-1 pl-5">
            {PAGE_FILES.map((f) => (
              <li key={f}>
                <code className="font-mono text-xs">{f}</code> — {t(`modules.file.${FILE_KEYS[f]}`)}
              </li>
            ))}
          </ul>
          <p>{t('modules.pageReload')}</p>
        </div>
      </CardContent>
    </Card>
  )
}
