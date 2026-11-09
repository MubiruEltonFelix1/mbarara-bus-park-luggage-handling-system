import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, List, MapPin, Plus, Truck } from 'lucide-react'
import { cn } from '../../lib/utils'

const ITEMS = [
  { label: 'Home', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Tickets', to: '/tickets', icon: List },
  { label: 'New', to: '/tickets/new', icon: Plus, primary: true },
  { label: 'Track', to: '/track', icon: MapPin },
  { label: 'Dispatch', to: '/dispatch', icon: Truck },
]

export function BottomNav() {
  const navigate = useNavigate()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-ink-200 bg-white pb-[env(safe-area-inset-bottom)] no-print lg:hidden">
      {ITEMS.map((item) =>
        item.primary ? (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className="relative -top-3 flex flex-1 flex-col items-center justify-end pb-1"
            aria-label={item.label}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-pop">
              <item.icon className="h-5 w-5" />
            </span>
            <span className="mt-0.5 text-[10px] font-medium text-brand-700">{item.label}</span>
          </button>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-brand-600' : 'text-ink-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5', isActive && 'text-brand-600')} />
                {item.label}
              </>
            )}
          </NavLink>
        ),
      )}
    </nav>
  )
}
