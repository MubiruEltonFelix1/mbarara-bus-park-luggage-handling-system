import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Menu, Plus, Search, MapPin } from 'lucide-react'
import { useApp } from '../../store/AppStore'
import { Button } from '../ui/Button'
import { cn, relativeTime } from '../../lib/utils'

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { settings, tickets } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/tickets?search=${encodeURIComponent(query.trim())}`)
  }

  const recentActivity = [...tickets]
    .flatMap((t) => t.statusHistory.map((h) => ({ ...h, ticketId: t.id })))
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, 5)
  const delayedCount = tickets.filter((t) => t.status === 'Delayed').length

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-100 bg-white/90 px-4 backdrop-blur-md no-print lg:px-6">
      {/* Mobile menu */}
      <button
        onClick={onOpenMenu}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Park location */}
      <div className="hidden items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-1.5 md:flex">
        <MapPin className="h-4 w-4 text-brand-600" />
        <div className="leading-tight">
          <p className="text-[11px] font-medium text-ink-400">Current park</p>
          <p className="text-xs font-semibold text-ink-800">{settings.parkName}</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={submitSearch} className="relative ml-auto hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ticket ID, sender, phone, destination…"
          className="h-10 w-full rounded-lg border border-ink-200 bg-ink-50 pl-10 pr-3 text-sm text-ink-900 placeholder:text-ink-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:ml-3">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {delayedCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {delayedCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 rounded-xl border border-ink-200 bg-white p-2 shadow-pop animate-scale-in">
              <p className="px-3 py-2 text-xs font-semibold text-ink-500">Recent activity</p>
              {recentActivity.length === 0 && <p className="px-3 py-6 text-center text-sm text-ink-400">No activity yet</p>}
              <div className="max-h-80 space-y-1 overflow-y-auto scrollbar-thin">
                {recentActivity.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigate(`/tickets/${a.ticketId}`)
                      setNotifOpen(false)
                    }}
                    className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-ink-50"
                  >
                    <span className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', a.status === 'Delayed' ? 'bg-red-500' : 'bg-brand-500')} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-ink-800">
                        {a.ticketId} — {a.status}
                      </p>
                      <p className="truncate text-[11px] text-ink-400">{relativeTime(a.timestamp)} · {a.staff}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-ink-100"
            aria-label="User profile"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {settings.attendants[0]?.name.slice(0, 1) ?? 'A'}
            </div>
            <span className="hidden text-sm font-medium text-ink-700 md:block">
              {settings.attendants[0]?.name ?? 'Attendant'}
            </span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-12 w-60 rounded-xl border border-ink-200 bg-white p-2 shadow-pop animate-scale-in">
              <div className="border-b border-ink-100 px-3 py-2.5">
                <p className="text-sm font-semibold text-ink-900">{settings.attendants[0]?.name ?? 'Attendant'}</p>
                <p className="text-xs text-ink-400">{settings.attendants[0]?.role ?? 'Staff'}</p>
              </div>
              <div className="py-1">
                <p className="px-3 py-1.5 text-xs text-ink-400">Signed in as {settings.parkName} staff</p>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-50" onClick={() => navigate('/settings')}>
                  Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* New ticket quick action */}
        <Button size="md" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/tickets/new')} className="hidden sm:inline-flex">
          New ticket
        </Button>
        <Button size="icon" onClick={() => navigate('/tickets/new')} className="sm:hidden" aria-label="New ticket">
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
