import { ChevronsUpDown, LogOut, PanelsTopLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { runningPages, useModulesInfo } from '@/lib/modules'
import { NAV_GROUPS, NAV_ITEMS } from '@/lib/navigation'

interface AppSidebarProps {
  username: string
  version: string
  onSignOut: () => void
}

/** Left navigation: wordmark, grouped screens, user menu and version. */
export function AppSidebar({ username, version, onSignOut }: AppSidebarProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const name = username || 'admin'
  const initials = name.slice(0, 2).toUpperCase()
  // Pages that running modules add to the web UI get their own group.
  const modulePages = runningPages(useModulesInfo().data)
  const versionLabel = version ? `v${version.replace(/^v/, '')}` : t('about.devBuild')

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/overview">
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-base font-semibold tracking-tight">Tamamo</span>
                  <span className="truncate text-xs text-muted-foreground">{t('shell.tagline')}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{t(`nav.group.${group}`)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.filter((item) => item.group === group).map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild isActive={pathname === item.path} tooltip={t(`nav.${item.key}`)}>
                      <Link to={item.path}>
                        <item.icon aria-hidden />
                        <span>{t(`nav.${item.key}`)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        {modulePages.length ? (
          <SidebarGroup>
            <SidebarGroupLabel>{t('nav.group.modulePages')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {modulePages.map((p) => (
                  <SidebarMenuItem key={p.to}>
                    <SidebarMenuButton asChild isActive={pathname === p.to} tooltip={p.page.title}>
                      <Link to={p.to}>
                        <PanelsTopLeft aria-hidden />
                        <span>{p.page.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" aria-label={t('shell.signOut')}>
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">{t('shell.role')}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" aria-hidden />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="min-w-56">
                <DropdownMenuLabel className="font-normal text-muted-foreground">{name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onSignOut}>
                  <LogOut aria-hidden />
                  {t('shell.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link
              to="/about"
              className="block px-2 py-1 text-xs text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden"
            >
              {t('shell.version')}: {versionLabel}
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
