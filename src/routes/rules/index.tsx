import './i18n'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ChevronDown, FileCode, Info, ListChecks, Plus } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { SiteScopePicker } from '@/components/site-scope-picker'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAtPath, setAtPath } from '@/lib/config'
import { useDraft, useScope } from '@/lib/draft-context'
import type { Protection, Rule } from '@/lib/types'

import { RuleCard } from './rule-card'
import { RuleTester } from './rule-tester'
import { RulesFileEditor } from './rules-file'
import { mkRule, newId, normalizeRule } from './helpers'
import { rich } from './rich'

type Mode = 'visual' | 'file'

/**
 * Rules screen: the ordered rule list for the global settings or one site,
 * presets and the rule tester (visual mode), and tamamo.yaml as text (file mode).
 */
export function RulesPage() {
  const { t } = useTranslation()
  const { draft, setDraft, defaults, dirty } = useDraft()
  const { site, isOwn, sectionPath } = useScope()

  const [mode, setMode] = useState<Mode>('visual')
  const [fileDirty, setFileDirty] = useState(false)
  /** A mode switch that needs confirmation first. */
  const [pendingMode, setPendingMode] = useState<{ to: Mode; fromFile: boolean } | null>(null)
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [restoreOpen, setRestoreOpen] = useState(false)

  const listPath = sectionPath('rules')
  const rules = getAtPath<Rule[]>(draft, listPath) ?? []
  // A site that follows the global rules: only the picker's notice and the tester show.
  const followsGlobal = !!site && !isOwn('rules')
  const defaultAction = getAtPath<Protection>(draft, sectionPath('protection'))?.default_action ?? 'challenge'
  const untitled = t('rules.untitled')

  const requestMode = (next: Mode) => {
    if (next === mode) return
    if (next === 'file' && dirty) {
      setPendingMode({ to: 'file', fromFile: false })
      return
    }
    if (next === 'visual' && fileDirty) {
      setPendingMode({ to: 'visual', fromFile: true })
      return
    }
    setMode(next)
  }

  const setOpen = (id: string, open: boolean) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (open) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const addRule = (rule: Rule, opts: { last: boolean; open: boolean }) => {
    setDraft((d) => {
      const list = getAtPath<Rule[]>(d, listPath)
      if (opts.last) list.push(rule)
      else list.unshift(rule)
    })
    if (opts.open) setOpen(rule.id, true)
    toast.info(t('rules.added', { name: rule.name }), {
      description: opts.last ? t('rules.addedBottom') : t('rules.addedTop'),
    })
    requestAnimationFrame(() => {
      document.querySelector(`[data-rule-id="${rule.id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  const moveRule = (from: number, to: number, id: string) => {
    setDraft((d) => {
      const list = getAtPath<Rule[]>(d, listPath)
      const [moved] = list.splice(from, 1)
      list.splice(to, 0, moved)
    })
    requestAnimationFrame(() => {
      const dir = to > from ? '1' : '-1'
      document.querySelector<HTMLButtonElement>(`[data-rule-id="${id}"] [data-move="${dir}"]`)?.focus()
    })
  }

  const duplicateRule = (rule: Rule, index: number) => {
    const copy: Rule = {
      ...structuredClone(normalizeRule(rule)),
      id: newId(),
      name: t('rules.copyName', { name: rule.name || untitled }),
    }
    setDraft((d) => {
      getAtPath<Rule[]>(d, listPath).splice(index + 1, 0, copy)
    })
    setOpen(copy.id, true)
  }

  const deleteRule = (id: string) => {
    setDraft((d) => {
      const list = getAtPath<Rule[]>(d, listPath)
      const idx = list.findIndex((r) => r.id === id)
      if (idx >= 0) list.splice(idx, 1)
    })
  }

  const restoreDefaults = () => {
    setDraft((d) => {
      setAtPath(d, listPath, defaults.rules.map((r) => normalizeRule(structuredClone(r))))
    })
  }

  const showVisualList = mode === 'visual' && !followsGlobal

  const pendingIsDraft = pendingMode !== null && !pendingMode.fromFile

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.rules')}
        description={mode === 'file' ? t('rulesFile.pageDesc') : followsGlobal ? t('rules.descShort') : t('rules.desc')}
        actions={
          <>
            <Tabs value={mode} onValueChange={(v) => requestMode(v as Mode)}>
              <TabsList aria-label={t('rules.mode.label')}>
                <TabsTrigger value="visual">
                  <ListChecks aria-hidden />
                  {t('rules.mode.visual')}
                </TabsTrigger>
                <TabsTrigger value="file">
                  <FileCode aria-hidden />
                  {t('rules.mode.file')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {showVisualList ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      {t('rules.addPreset')}
                      <ChevronDown aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>{t('rules.presets')}</DropdownMenuLabel>
                    {defaults.presets.map((p) => (
                      <DropdownMenuItem
                        key={p.key}
                        className="flex-col items-start gap-0.5"
                        onSelect={() =>
                          addRule(
                            { ...normalizeRule(structuredClone(p.rule)), id: newId() },
                            { last: p.position === 'bottom', open: !!p.open },
                          )
                        }
                      >
                        <span className="font-medium">{p.label}</span>
                        <span className="text-xs whitespace-normal text-muted-foreground">{p.description}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex-col items-start gap-0.5"
                      onSelect={() => setRestoreOpen(true)}
                    >
                      <span className="font-medium">{t('rules.restore')}</span>
                      <span className="text-xs whitespace-normal text-muted-foreground">{t('rules.restoreDesc')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() => addRule(mkRule(t('rules.newRule'), 'challenge'), { last: true, open: true })}
                >
                  <Plus aria-hidden />
                  {t('rules.add')}
                </Button>
              </>
            ) : null}
          </>
        }
      />

      {mode === 'file' ? (
        <RulesFileEditor onDirtyChange={setFileDirty} />
      ) : (
        <div className="space-y-6">
          <SiteScopePicker section="rules" />

          {showVisualList ? (
            <div className="space-y-4">
              <Alert>
                <Info aria-hidden />
                <AlertTitle>{t('rules.syntaxTitle')}</AlertTitle>
                <AlertDescription><p>{rich(t('rules.syntaxDesc'))}</p></AlertDescription>
              </Alert>

              {rules.length ? (
                <div role="list" aria-label={t('rules.listLabel')} className="space-y-3">
                  {rules.map((rule, i) => (
                    <RuleCard
                      key={rule.id}
                      rule={rule}
                      index={i}
                      total={rules.length}
                      listPath={listPath}
                      open={openIds.has(rule.id)}
                      onOpenChange={(open) => setOpen(rule.id, open)}
                      onMove={(to) => moveRule(i, to, rule.id)}
                      onDuplicate={() => duplicateRule(rule, i)}
                      onDelete={() => setPendingDelete({ id: rule.id, name: rule.name || untitled })}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="space-y-1 py-10 text-center">
                    <p className="font-medium">{t('rules.none')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('rules.noneDesc', { action: t(`action.${defaultAction}`, { defaultValue: defaultAction }) })}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}

          <RuleTester />
        </div>
      )}

      {/* Switching the editor mode with unsaved changes. */}
      <AlertDialog open={pendingMode !== null} onOpenChange={(open) => !open && setPendingMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingIsDraft ? t('rulesFile.dirtyTitle') : t('rulesFile.leaveTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingIsDraft ? t('rulesFile.dirtyDesc') : t('rulesFile.leaveDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingMode) setMode(pendingMode.to)
                setPendingMode(null)
              }}
            >
              {pendingIsDraft ? t('rulesFile.switchAnyway') : t('rulesFile.leave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rules.deleteTitle', { name: pendingDelete?.name ?? '' })}</AlertDialogTitle>
            <AlertDialogDescription>{t('rules.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) deleteRule(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              {t('rules.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rules.restoreTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('rules.restoreConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                restoreDefaults()
                setRestoreOpen(false)
              }}
            >
              {t('rules.restoreConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
