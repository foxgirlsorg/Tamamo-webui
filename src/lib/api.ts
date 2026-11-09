import type {
  AppState,
  ConfigResponse,
  Config,
  ModulesResponse,
  PreviewRequest,
  RulesFile,
  StatsSnapshot,
  TestRequest,
  TestResult,
  UploadMap,
  UploadSlot,
} from '@/lib/types'

/** An error answered by the admin API (or a network failure, status 0). */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type UnauthorizedListener = () => void
let unauthorizedListener: UnauthorizedListener | null = null

/**
 * Registered by the auth layer. Called when the API answers 401 to a request
 * that did not opt out (login, setup and state checks opt out). The listener
 * should refresh the auth state so the app shows the sign-in screen.
 */
export function onUnauthorized(listener: UnauthorizedListener | null): void {
  unauthorizedListener = listener
}

interface RequestOptions {
  body?: unknown
  /** Multipart form data (sent as-is, without a JSON content type). */
  form?: FormData
  /** Read the response as text (HTML) instead of JSON. */
  text?: boolean
  /** Do not treat 401 as "signed out" (the auth endpoints themselves). */
  allow401?: boolean
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-Tamamo-Request': '1' }
  let payload: BodyInit | undefined
  if (opts.form) {
    payload = opts.form
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(opts.body)
  }

  let res: Response
  try {
    res = await fetch(path, {
      method,
      headers,
      body: payload,
      credentials: 'same-origin',
      cache: 'no-store',
    })
  } catch {
    throw new ApiError("Can't reach Tamamo. Is it still running?", 0)
  }

  if (res.status === 401 && !opts.allow401) {
    unauthorizedListener?.()
    throw new ApiError('Your session has ended. Please sign in again.', 401)
  }

  if (opts.text && res.ok) return (await res.text()) as T

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    // Not JSON: fall through with null.
  }
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Request failed (${res.status})`
    throw new ApiError(message, res.status)
  }
  return data as T
}

/** Image URL for an upload slot. Pass the cache-busting version when you have one. */
export function imageUrl(slot: UploadSlot, version?: string | number): string {
  return version === undefined ? `/assets/img/${slot}` : `/assets/img/${slot}?v=${version}`
}

export const api = {
  // ---- auth ----------------------------------------------------------------
  state: () => request<AppState>('GET', '/api/state', { allow401: true }),
  setup: (username: string, password: string) =>
    request<{ ok: boolean; username: string }>('POST', '/api/setup', {
      body: { username, password },
      allow401: true,
    }),
  login: (username: string, password: string) =>
    request<{ ok: boolean; username: string }>('POST', '/api/login', {
      body: { username, password },
      allow401: true,
    }),
  logout: () => request<{ ok: boolean }>('POST', '/api/logout', { allow401: true }),

  /** Changes the login. Send new_username and/or new_password; current is always required. */
  changePassword: (body: { current: string; new_username?: string; new_password?: string }) =>
    request<{ ok: boolean; username: string }>('POST', '/api/password', { body }),
  rotateSecret: () => request<{ ok: boolean }>('POST', '/api/secret/rotate'),
  disableAdmin: () => request<{ ok: boolean }>('POST', '/api/admin/disable'),

  // ---- config --------------------------------------------------------------
  getConfig: () => request<ConfigResponse>('GET', '/api/config'),
  /** Saves the whole config. The response replaces the draft. */
  putConfig: (config: Config) => request<ConfigResponse>('PUT', '/api/config', { body: config }),

  getRulesFile: () => request<RulesFile>('GET', '/api/rules/file'),
  putRulesFile: (yaml: string) => request<RulesFile>('PUT', '/api/rules/file', { body: { yaml } }),

  // ---- stats ---------------------------------------------------------------
  /** Stats for one site ID, or for every site when omitted. */
  getStats: (site?: string) =>
    request<StatsSnapshot>('GET', site ? `/api/stats?site=${encodeURIComponent(site)}` : '/api/stats'),
  resetStats: () => request<{ ok: boolean }>('POST', '/api/stats/reset'),

  // ---- checking page -------------------------------------------------------
  /** Renders the checking page as HTML, for an iframe srcdoc. */
  previewPage: (body: PreviewRequest) =>
    request<string>('POST', '/api/preview', { body, text: true }),

  /** Uploads an image for a slot. Returns the new upload map. */
  uploadImage: (slot: UploadSlot, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ uploads: UploadMap }>('POST', `/api/upload/${slot}`, { form })
  },
  deleteUpload: (slot: UploadSlot) =>
    request<{ uploads: UploadMap }>('DELETE', `/api/upload/${slot}`),

  // ---- rules, modules, admin tools ----------------------------------------
  /** Runs a request through the rule set and reports the matching rule and action. */
  testRule: (body: TestRequest) => request<TestResult>('POST', '/api/test', { body }),
  getModules: () => request<ModulesResponse>('GET', '/api/modules'),
}

export type Api = typeof api
