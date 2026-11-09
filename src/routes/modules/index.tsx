import './i18n'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Info, Plus, TriangleAlert } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useDraft } from '@/lib/draft-context'
import type { ModuleConfig } from '@/lib/types'

import { AddModuleDialog } from './add-module-dialog'
import { ModuleCard } from './module-card'
import { PageModulesCard } from './page-modules-card'

/** The module list, Go modules and page add-ons from the backend. Refetched on every visit. */
const MODULES_INFO_KEY = ['modules-info'] as const

/** Configures the module pipeline: order, enable, sites, settings and page add-ons. */
export function ModulesPage() {
  const { t } = useTranslation()
  const { draft, setDraft } = useDraft()
  const info = useQuery({
    queryKey: MODULES_INFO_KEY,
    queryFn: api.getModules,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const [addOpen, setAddOpen] = useState(false)
  // Indexes of the expanded cards. Moving a card moves its open state with it.
  const [openSet, setOpenSet] = useState<Set<number>>(() => new Set())
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const modules = draft.modules
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.modules')}
        description={t('modules.desc')}
        actions={
          <Button onClick={() => setAddOpen(true)} disabled={info.isPending}>
            <Plus aria-hidden />
            {t('modules.add')}
          </Button>
        }
      />

      <Alert>
        <Info aria-hidden />
        <AlertTitle>{t('modules.orderTitle')}</AlertTitle>
        <AlertDescription>
          <p>
            {t('modules.orderDesc')} <span className="whitespace-nowrap">{t('modules.howItWorks')}: <code className="font-mono text-xs">{t('modules.docsRef')}</code></span>
          </p>
        </AlertDescription>
      </Alert>

      {info.isError ? (
        <Alert>
          <TriangleAlert aria-hidden />
          <AlertTitle>{t('modules.loadError')}</AlertTitle>
          <AlertDescription>{info.error instanceof Error ? info.error.message : null}</AlertDescription>
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

      {info.isPending ? <Skeleton className="h-40 w-full" /> : <PageModulesCard info={info.data} />}

      <AddModuleDialog open={addOpen} onOpenChange={setAddOpen} info={info.data} onAdd={addModule} />

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
