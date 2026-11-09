import { QueryClient } from '@tanstack/react-query'

import { onUnauthorized } from '@/lib/api'
import { AUTH_STATE_KEY, CONFIG_QUERY_KEY, setSignInNotice } from '@/lib/auth'
import type { AppState } from '@/lib/types'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

// Any 401 from the admin API means the session is gone: show the sign-in screen
// and drop the cached config so the next sign-in loads fresh settings.
onUnauthorized(() => {
  setSignInNotice('auth.sessionEnded')
  queryClient.setQueryData<AppState>(AUTH_STATE_KEY, (s) => (s ? { ...s, authenticated: false } : s))
  queryClient.removeQueries({ queryKey: CONFIG_QUERY_KEY })
})
