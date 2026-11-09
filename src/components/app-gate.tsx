import { useTranslation } from 'react-i18next'

import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { LoginPage, SetupPage } from '@/routes/auth'
import { useAppState } from '@/lib/auth'
import { DraftProvider } from '@/lib/draft'

/**
 * Decides what the admin shows: a loading state, the first-run setup, the
 * sign-in screen, or the app. The app's config loads only after sign-in, so the
 * draft provider sits here.
 */
export function AppGate() {
  const { t } = useTranslation()
  const state = useAppState()

  if (state.isPending) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <img src="/assets/mascot/checking.png" alt="" width={72} height={72} />
        <Skeleton className="h-4 w-40" />
      </div>
    )
  }

  if (state.isError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-medium">{t('boot.loadError')}</p>
        <p className="text-sm text-muted-foreground">{state.error instanceof Error ? state.error.message : null}</p>
        <Button variant="outline" onClick={() => void state.refetch()}>
          {t('common.tryAgain')}
        </Button>
      </div>
    )
  }

  const current = state.data
  if (current.setup_required) return <SetupPage />
  if (!current.authenticated) return <LoginPage />

  return (
    <DraftProvider>
      <AppLayout state={current} />
    </DraftProvider>
  )
}
