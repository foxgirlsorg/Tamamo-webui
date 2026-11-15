import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router'

import { AppSidebar } from '@/components/app-sidebar'
import { UnsavedBar } from '@/components/unsaved-bar'
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { api } from '@/lib/api'
import { AUTH_STATE_KEY, CONFIG_QUERY_KEY, setSignInNotice } from '@/lib/auth'
import { useDraft } from '@/lib/draft-context'
import { runningPages, useModulesInfo } from '@/lib/modules'
import { HOME_PATH, NAV_ITEMS } from '@/lib/navigation'
import type { AppState } from '@/lib/types'
import { queryClient } from '@/lib/query-client'

interface AppLayoutProps {
  state: AppState
}

/**
 * Shell of the signed-in app: sidebar, top bar with breadcrumb, the screen
 * (Outlet) and the sticky unsaved-changes bar. Rendered inside DraftProvider.
 */
export function AppLayout({ state }: AppLayoutProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { dirty } = useDraft()
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  const current = NAV_ITEMS.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
  const sectionTitle = current ? t(`nav.${current.key}`) : t('nav.overview')
  // A module's own page sits under Modules in the breadcrumb.
  const modulePage = runningPages(useModulesInfo().data).find((p) => p.to === decodeURIComponent(pathname))
  const pageTitle = modulePage ? modulePage.page.title : sectionTitle

  useEffect(() => {
    document.title = t('shell.docTitle', { page: pageTitle })
  }, [t, pageTitle])

  const performSignOut = async () => {
    try {
      await api.logout()
    } catch {
      // The session may already be gone on the server. Show the sign-in screen either way.
    }
    setSignInNotice('auth.signedOut')
    queryClient.setQueryData(AUTH_STATE_KEY, { ...state, authenticated: false })
    queryClient.removeQueries({ queryKey: CONFIG_QUERY_KEY })
  }

  const requestSignOut = () => {
    if (dirty) setConfirmSignOut(true)
    else void performSignOut()
  }

  return (
    <SidebarProvider>
      <AppSidebar username={state.username} version={state.version} onSignOut={requestSignOut} />
      <SidebarInset className="min-h-svh min-w-0">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden sm:inline-flex">
                <BreadcrumbLink href={`#${HOME_PATH}`}>Tamamo</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:inline-flex" />
              {modulePage && current ? (
                <>
                  <BreadcrumbItem className="hidden sm:inline-flex">
                    <BreadcrumbLink href={`#${current.path}`}>{sectionTitle}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden sm:inline-flex" />
                </>
              ) : null}
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
          {state.restart_required ? (
            <Alert>
              <AlertTitle>{t('shell.restartTitle')}</AlertTitle>
              <AlertDescription>
                {t('shell.restartDesc', { proxy: state.listen, admin: state.admin_listen })}
              </AlertDescription>
            </Alert>
          ) : null}
          <Outlet />
        </main>

        <UnsavedBar />
      </SidebarInset>

      <AlertDialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('shell.signOutDirtyTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('shell.signOutDirtyDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmSignOut(false)
                void performSignOut()
              }}
            >
              {t('shell.signOut')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}
