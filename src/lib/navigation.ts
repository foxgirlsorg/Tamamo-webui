import {
  Activity,
  Globe,
  Info,
  LayoutDashboard,
  ListChecks,
  Lock,
  Paintbrush,
  Puzzle,
  Server,
  Settings,
  Shield,
  type LucideIcon,
} from 'lucide-react'

export type NavGroup = 'monitor' | 'configure' | 'admin'

export interface NavItem {
  /** Route segment and i18n key suffix (`nav.<key>`). */
  key: string
  /** Absolute path under the hash router. */
  path: string
  icon: LucideIcon
  group: NavGroup
}

/** Sidebar groups, in display order. Labels are `nav.group.<group>`. */
export const NAV_GROUPS: NavGroup[] = ['monitor', 'configure', 'admin']

/** Every admin screen, in sidebar order within each group. */
export const NAV_ITEMS: NavItem[] = [
  { key: 'overview', path: '/overview', icon: LayoutDashboard, group: 'monitor' },
  { key: 'sites', path: '/sites', icon: Globe, group: 'monitor' },
  { key: 'activity', path: '/activity', icon: Activity, group: 'monitor' },
  { key: 'protection', path: '/protection', icon: Shield, group: 'configure' },
  { key: 'rules', path: '/rules', icon: ListChecks, group: 'configure' },
  { key: 'modules', path: '/modules', icon: Puzzle, group: 'configure' },
  { key: 'page', path: '/page', icon: Paintbrush, group: 'configure' },
  { key: 'server', path: '/server', icon: Server, group: 'configure' },
  { key: 'security', path: '/security', icon: Lock, group: 'admin' },
  { key: 'settings', path: '/settings', icon: Settings, group: 'admin' },
  { key: 'about', path: '/about', icon: Info, group: 'admin' },
]

/** Default route when the URL has no screen. */
export const HOME_PATH = '/overview'
