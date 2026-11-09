import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Query key of GET /api/state (setup / signed-in status and version). */
export const AUTH_STATE_KEY = ['state'] as const
/** Query key of GET/PUT /api/config. */
export const CONFIG_QUERY_KEY = ['config'] as const

/** GET /api/state. Never throws on 401: that is the signed-out answer. */
export function useAppState() {
  return useQuery({
    queryKey: AUTH_STATE_KEY,
    queryFn: () => api.state(),
    staleTime: 0,
  })
}

// A one-shot message for the sign-in screen (e.g. "your session has ended").
let signInNotice: string | null = null

export function setSignInNotice(key: string | null): void {
  signInNotice = key
}

/** Returns the pending sign-in notice (an i18n key) and clears it. */
export function takeSignInNotice(): string | null {
  const v = signInNotice
  signInNotice = null
  return v
}
