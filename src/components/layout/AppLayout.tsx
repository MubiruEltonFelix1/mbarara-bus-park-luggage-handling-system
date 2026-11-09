import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { BottomNav } from './BottomNav'
import { cn } from '../../lib/utils'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Scroll to top on navigation
  useEffect(() => {
    const el = document.getElementById('app-scroll')
    if (el) el.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-ink-200 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile slide-out menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] animate-slide-in-right">
            <div className="relative h-full">
              <Sidebar onNavigate={() => setMenuOpen(false)} />
              <button
                onClick={() => setMenuOpen(false)}
                className="absolute right-2 top-3.5 inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main id="app-scroll" className="flex-1 overflow-y-auto scrollbar-thin">
          <div className={cn('mx-auto w-full max-w-7xl px-4 pb-24 pt-5 lg:px-8 lg:pb-10')}>
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
