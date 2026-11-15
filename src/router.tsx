import { createHashRouter, Navigate } from 'react-router'

import { AppGate } from '@/components/app-gate'
import { HOME_PATH } from '@/lib/navigation'
import { AboutPage } from '@/routes/about'
import { ActivityPage } from '@/routes/activity'
import { ModulesPage } from '@/routes/modules'
import { ModulePageScreen } from '@/routes/modules/module-page'
import { OverviewPage } from '@/routes/overview'
import { PageDesignerPage } from '@/routes/page'
import { ProtectionPage } from '@/routes/protection'
import { RulesPage } from '@/routes/rules'
import { SecurityPage } from '@/routes/security'
import { ServerPage } from '@/routes/server'
import { SettingsPage } from '@/routes/settings'
import { SitesPage } from '@/routes/sites'

/**
 * Hash router, so the static container needs no URL rewrites. Every screen
 * sits under AppGate, which shows setup or sign-in until the admin is signed in.
 */
export const router = createHashRouter([
  {
    path: '/',
    Component: AppGate,
    children: [
      { index: true, element: <Navigate to={HOME_PATH} replace /> },
      { path: 'overview', Component: OverviewPage },
      { path: 'sites', Component: SitesPage },
      { path: 'activity', Component: ActivityPage },
      { path: 'protection', Component: ProtectionPage },
      { path: 'rules', Component: RulesPage },
      { path: 'modules', Component: ModulesPage },
      { path: 'modules/:name/:page', Component: ModulePageScreen },
      { path: 'page', Component: PageDesignerPage },
      { path: 'server', Component: ServerPage },
      { path: 'security', Component: SecurityPage },
      { path: 'settings', Component: SettingsPage },
      { path: 'about', Component: AboutPage },
      { path: '*', element: <Navigate to={HOME_PATH} replace /> },
    ],
  },
])
