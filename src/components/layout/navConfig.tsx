import { LayoutDashboard, FilePlus2, List, MapPin, Truck, BarChart3, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  match?: (path: string) => boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, match: (p) => p === '/dashboard' || p === '/' },
  { label: 'New ticket', to: '/tickets/new', icon: FilePlus2, match: (p) => p === '/tickets/new' },
  { label: 'All tickets', to: '/tickets', icon: List, match: (p) => p.startsWith('/tickets/') && p !== '/tickets/new' || p === '/tickets' },
  { label: 'Track parcel', to: '/track', icon: MapPin, match: (p) => p.startsWith('/track') },
  { label: 'Dispatch', to: '/dispatch', icon: Truck, match: (p) => p === '/dispatch' },
  { label: 'Reports', to: '/reports', icon: BarChart3, match: (p) => p === '/reports' },
  { label: 'Settings', to: '/settings', icon: Settings, match: (p) => p === '/settings' },
]
