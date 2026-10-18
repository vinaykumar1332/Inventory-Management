import { navigationConfig, type NavItemConfig } from '@/config'
import { getIcon } from '@/config/icons'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAlerts } from '@/hooks/queries'

export type NavItem = NavItemConfig & { Icon: ReturnType<typeof getIcon> }

const ALL_ITEMS: NavItem[] = navigationConfig.items.map((i) => ({ ...i, Icon: getIcon(i.icon) }))

/** Navigation items from navigation.json the signed-in role may see */
export function useVisibleNav(): NavItem[] {
  const { can } = useAuth()
  return ALL_ITEMS.filter((i) => !i.permission || can(i.permission))
}

/** Bottom bar items on phones, applying configured fallbacks for hidden routes */
export function useMobileNav(): NavItem[] {
  const visible = useVisibleNav()
  const { items, fallbacks } = navigationConfig.mobileBottomNav
  return items
    .map((to) => visible.find((i) => i.to === to) ?? visible.find((i) => i.to === fallbacks[to]))
    .filter((i): i is NavItem => !!i)
}

export function useNavBadge(item: NavItemConfig): number | null {
  const { data } = useAlerts()
  if (item.badge !== 'unreadAlerts') return null
  const n = data?.filter((a) => !a.read && !a.resolved).length ?? 0
  return n > 0 ? n : null
}

export const NAV_SECTIONS = navigationConfig.sections
export const MOBILE_HIGHLIGHT = navigationConfig.mobileBottomNav.highlight
