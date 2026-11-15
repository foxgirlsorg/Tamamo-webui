// Checking-page designer (Configure → Checking page). Settings on the left in
// tabs; a live preview of POST /api/preview on the right. Global settings or one
// site's own copy, chosen with the scope picker.

import './i18n'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Info, RotateCcw } from 'lucide-react'

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { SiteScopePicker } from '@/components/site-scope-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useScope } from '@/lib/draft-context'

import { AdvancedTab } from './tab-advanced'
import { LanguagesTab } from './tab-languages'
import { LayoutTab } from './tab-layout'
import { LookTab } from './tab-look'
import { MascotTab } from './tab-mascot'
import { ProgressTab } from './tab-progress'
import { TextEditor } from './text-editor'
import { DesignerProvider } from './designer-context'
import { useDesigner } from './designer-store'
import { PreviewPane } from './preview-pane'

type TabId = 'texts' | 'look' | 'layout' | 'mascot' | 'progress' | 'languages' | 'advanced'

const TABS: { id: TabId; label: string }[] = [
  { id: 'texts', label: 'page.tabs.texts' },
  { id: 'look', label: 'page.tabs.look' },
  { id: 'layout', label: 'page.tab.layout' },
  { id: 'mascot', label: 'page.tabs.mascot' },
  { id: 'progress', label: 'page.tabs.progress' },
  { id: 'languages', label: 'page.tabs.languages' },
  { id: 'advanced', label: 'page.tabs.advanced' },
]

export function PageDesignerPage() {
  return (
    <DesignerProvider>
      <DesignerView />
    </DesignerProvider>
  )
}

function DesignerView() {
  const { t } = useTranslation()
  const { site, isOwn } = useScope()
  const { page, previewState, setPreviewState, editLang, setEditLang, previewSite, previewRevision, resetPage } = useDesigner()
  const [tab, setTab] = useState<TabId>('texts')
  const [confirmReset, setConfirmReset] = useState(false)

  // A site that follows the global checking page shows only the scope notice (from the picker).
  const editable = !site || isOwn('page')

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.page')}
        description={editable ? t('page.desc') : t('page.descShort')}
        actions={
          editable ? (
            <Button variant="outline" onClick={() => setConfirmReset(true)}>
              <RotateCcw aria-hidden />
              {t('page.reset')}
            </Button>
          ) : null
        }
      />

      <SiteScopePicker section="page" />

      {editable ? (
        <>
          <Alert>
            <Info aria-hidden />
            <AlertTitle>{t('page.creditTitle')}</AlertTitle>
            <AlertDescription>{t('page.creditDesc')}</AlertDescription>
          </Alert>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <Tabs
              value={tab}
              onValueChange={(v) => {
                const next = v as TabId
                setTab(next)
                // Texts always edits the main language; the preview follows the tab.
                if (next === 'texts') setEditLang('')
              }}
              className="min-w-0 gap-4"
            >
              <TabsList className="h-auto! w-full flex-wrap justify-start [&>*]:flex-none">
                {TABS.map((item) => (
                  <TabsTrigger key={item.id} value={item.id}>
                    {t(item.label)}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="texts">
                <TextEditor target="main" />
              </TabsContent>
              <TabsContent value="look">
                <LookTab />
              </TabsContent>
              <TabsContent value="layout">
                <LayoutTab />
              </TabsContent>
              <TabsContent value="mascot">
                <MascotTab />
              </TabsContent>
              <TabsContent value="progress">
                <ProgressTab />
              </TabsContent>
              <TabsContent value="languages">
                <LanguagesTab />
              </TabsContent>
              <TabsContent value="advanced">
                <AdvancedTab />
              </TabsContent>
            </Tabs>

            <div className="min-w-0 xl:sticky xl:top-4">
              <PreviewPane
                page={page}
                state={previewState}
                onStateChange={setPreviewState}
                lang={editLang}
                onLangChange={setEditLang}
                site={previewSite}
                revision={previewRevision}
              />
            </div>
          </div>
        </>
      ) : null}

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('page.resetTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('page.resetDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                resetPage()
                setConfirmReset(false)
              }}
            >
              {t('page.resetConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
