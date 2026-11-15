import { useState } from 'react'
import { ExternalLink, Info, Plus, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { PageHeader } from '@/components/page-header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDraft } from '@/lib/draft-context'
import { moduleIdOf, useModulesInfo } from '@/lib/modules'
import type { ModuleConfig, ModuleInfo } from '@/lib/types'

import { AddModuleDialog } from './add-module-dialog'
import { ModuleCard } from './module-card'

/** How to build a Tamamo with modules, shown next to the list of what this build has. */
const BUILD_COMMAND = 'tamamo-build --with github.com/you/your-module'
const DOCKER_COMMAND = 'docker build --build-arg MODULES="github.com/you/your-module" -t tamamo .'

/** Configures the module pipeline: order, enable, sites and settings of the modules in this build. */
export function ModulesPage() {
  const { t } = useTranslation()
  const { draft, setDraft, server } = useDraft()
  const info = useModulesInfo()

  const [addOpen, setAddOpen] = useState(false)
  const [addId, setAddId] = useState<string | undefined>(undefined)
  // Indexes of the expanded cards. Moving a card moves its open state with it.
  const [openSet, setOpenSet] = useState<Set<number>>(() => new Set())
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const modules = draft.modules
  const available = info.data?.available ?? []
  const deleting = deleteIndex !== null ? modules[deleteIndex] : undefined
  const deletingName = deleting?.name || t('modules.unnamed')

  const setOpen = (i: number, open: boolean) => {
    setOpenSet((prev) => {
      const next = new Set(prev)
      if (open) next.add(i)
      else next.delete(i)
      return next
    })
  }

  const move = (i: number, delta: -1 | 1) => {
    setDraft((d) => {
      const [item] = d.modules.splice(i, 1)
      d.modules.splice(i + delta, 0, item)
    })
    setOpenSet(openSet.has(i) ? new Set([i + delta]) : new Set())
  }

  const remove = (i: number) => {
    setDraft((d) => {
      d.modules.splice(i, 1)
    })
    setOpenSet(new Set())
    setDeleteIndex(null)
  }

  const addModule = (m: ModuleConfig) => {
    setDraft((d) => {
      d.modules.push(m)
    })
    setOpenSet(new Set([modules.length]))
    toast.info(t('modules.added', { name: m.name }), { description: t('common.saveToApply') })
  }

  const openAdd = (id?: string) => {
    setAddId(id)
    setAddOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.modules')}
        description={t('modules.desc')}
        actions={
          <Button onClick={() => openAdd()} disabled={!available.length}>
            <Plus aria-hidden />
            {t('modules.add')}
          </Button>
        }
      />

      {info.isError ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertTitle>{t('modules.loadError')}</AlertTitle>
          <AlertDescription>{info.error instanceof Error ? info.error.message : null}</AlertDescription>
        </Alert>
      ) : null}

      {modules.length > 1 ? (
        <Alert>
          <Info aria-hidden />
          <AlertTitle>{t('modules.orderTitle')}</AlertTitle>
          <AlertDescription>
            <p>{t('modules.orderDesc')}</p>
          </AlertDescription>
        </Alert>
      ) : null}

      {modules.length ? (
        <ul aria-label={t('modules.listLabel')} className="space-y-3">
          {modules.map((m, i) => (
            <ModuleCard
              key={i}
              index={i}
              total={modules.length}
              module={m}
              saved={server.config.modules.find((s) => s.name === m.name)}
              info={info.data}
              open={openSet.has(i)}
              onOpenChange={(open) => setOpen(i, open)}
              onMove={(delta) => move(i, delta)}
              onDelete={() => setDeleteIndex(i)}
            />
          ))}
        </ul>
      ) : (
        <Card>
          <CardContent className="space-y-1 py-10 text-center">
            <p className="font-medium">{t('modules.none')}</p>
            <p className="text-sm text-muted-foreground">{t('modules.noneDesc')}</p>
          </CardContent>
        </Card>
      )}

      {info.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <AvailableCard available={available} inUse={new Set(modules.map(moduleIdOf))} onAdd={openAdd} />
      )}

      <AddModuleDialog open={addOpen} onOpenChange={setAddOpen} available={available} initialId={addId} onAdd={addModule} />

      <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('modules.deleteTitle', { name: deletingName })}</AlertDialogTitle>
            <AlertDialogDescription>{t('modules.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteIndex !== null && remove(deleteIndex)}>
              {t('modules.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/** The modules compiled into this build, and how to build one with more. */
function AvailableCard({
  available,
  inUse,
  onAdd,
}: {
  available: ModuleInfo[]
  inUse: Set<string>
  onAdd: (id: string) => void
}) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{available.length ? t('modules.available.title') : t('modules.available.noneTitle')}</CardTitle>
        <CardDescription>{available.length ? t('modules.available.desc') : t('modules.available.noneDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {available.length ? (
          <ul className="divide-y rounded-lg border">
            {available.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start gap-3 p-3">
                <div className="min-w-0 grow basis-64 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.name}</span>
                    <code className="font-mono text-xs text-muted-foreground">{a.id}</code>
                    {a.version ? <Badge variant="outline">{t('modules.available.version', { version: a.version.replace(/^v/, '') })}</Badge> : null}
                    {inUse.has(a.id) ? <Badge variant="secondary">{t('modules.available.inUse')}</Badge> : null}
                  </div>
                  {a.description ? <p className="text-sm text-muted-foreground">{a.description}</p> : null}
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {a.author ? <span>{t('modules.available.by', { author: a.author })}</span> : null}
                    <span>{t('modules.available.settingsCount', { count: a.settings.length })}</span>
                    {a.has_ui && a.pages.length ? <span>{t('modules.available.pagesCount', { count: a.pages.length })}</span> : null}
                    {/^https?:\/\//i.test(a.homepage) ? (
                      <a
                        href={a.homepage}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
                      >
                        {t('modules.available.homepage')}
                        <ExternalLink aria-hidden className="size-3" />
                      </a>
                    ) : null}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => onAdd(a.id)}>
                  <Plus aria-hidden />
                  {t('modules.available.addThis')}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="space-y-2 text-sm">
          {available.length ? <p className="text-muted-foreground">{t('modules.available.moreDesc')}</p> : null}
          <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">{BUILD_COMMAND}</pre>
          <p className="text-muted-foreground">{t('modules.available.dockerAlt')}</p>
          <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">{DOCKER_COMMAND}</pre>
          <p className="text-xs text-muted-foreground">
            {t('modules.howItWorks')}: <code className="font-mono">{t('modules.docsRef')}</code>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
