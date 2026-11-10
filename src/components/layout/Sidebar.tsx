import { NavLink } from 'react-router-dom'
import { PackageCheck } from 'lucide-react'
import { NAV_ITEMS } from './navConfig'
import { cn } from '../../lib/utils'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-ink-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
          <PackageCheck className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-extrabold tracking-tight text-ink-900">ParcelFlow</p>
          <p className="text-[10px] font-medium text-ink-400">Smart parcel ticketing</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">Menu</p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-[18px] w-[18px]', isActive ? 'text-brand-600' : 'text-ink-400')} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-100 p-3">
        <div className="rounded-xl bg-ink-50 p-3">
          <p className="text-xs font-semibold text-ink-700">ParcelFlow v1.0</p>
          <p className="mt-0.5 text-[11px] text-ink-400">Built for Ugandan bus parks. Demo mode with local data.</p>
        </div>
      </div>
    </div>
  )
}
