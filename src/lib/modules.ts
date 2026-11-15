// What the backend knows about modules (GET /api/modules), shared by the
// sidebar, the modules screen and modules' own pages.

import '@/routes/modules/i18n'

import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'
import type { ModuleConfig, ModuleInfo, ModulePage, ModulesResponse, RunningModule } from '@/lib/types'

export const MODULES_INFO_KEY = ['modules-info'] as const

/** The modules of this build and the ones running. Refetched after every config save. */
export function useModulesInfo() {
  return useQuery({
    queryKey: MODULES_INFO_KEY,
    queryFn: api.getModules,
    staleTime: 30_000,
  })
}

/** ID of the registered module a config entry runs. */
export function moduleIdOf(m: Pick<ModuleConfig, 'name' | 'module'>): string {
  return m.module || m.name
}

/** A page of a running module, with what is needed to link to and load it. */
export interface RunningPage {
  /** Name of the config entry. */
  name: string
  info: ModuleInfo
  page: ModulePage
  /** Route in the web UI. */
  to: string
}

/** Route of a module page in the web UI. */
export function modulePagePath(name: string, pageId: string): string {
  return `/modules/${encodeURIComponent(name)}/${encodeURIComponent(pageId)}`
}

/** Every page of every running module, in config order. */
export function runningPages(info: ModulesResponse | undefined): RunningPage[] {
  if (!info) return []
  const out: RunningPage[] = []
  for (const run of info.running) {
    const mod = info.available.find((a) => a.id === run.module)
    if (!mod?.has_ui) continue
    for (const page of mod.pages) out.push({ name: run.name, info: mod, page, to: modulePagePath(run.name, page.id) })
  }
  return out
}

export function findRunning(info: ModulesResponse | undefined, name: string): RunningModule | undefined {
  return info?.running.find((r) => r.name === name)
}

/** URL of a module page's HTML file, loaded in a frame. */
export function modulePageSrc(info: ModulesResponse, page: RunningPage, lang: string): string {
  const base = (info.ui_url || '/assets/modules/ui').replace(/\/+$/, '')
  const file = page.page.path.split('/').map(encodeURIComponent).join('/')
  const query = new URLSearchParams({ module: page.name, lang })
  return `${base}/${encodeURIComponent(page.info.id)}/${file}?${query.toString()}`
}
