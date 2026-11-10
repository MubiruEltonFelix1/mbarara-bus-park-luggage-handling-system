import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PackageCheck, Search, ArrowLeft } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { TrackingView } from '../components/tickets/TrackingView'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'

export function PublicTrack() {
  const { ticketId } = useParams()
  const { getTicket } = useApp()
  const toast = useToast()
  const [query, setQuery] = useState('')

  const decoded = ticketId ? decodeURIComponent(ticketId) : ''
  const ticket = getTicket(decoded)

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Branded top bar */}
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2.5 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <PackageCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-extrabold tracking-tight text-ink-900">ParcelFlow</p>
            <p className="text-[10px] font-medium text-ink-400">Smart parcel ticketing & tracking</p>
          </div>
          <a href="#/dashboard" className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-800">
            <ArrowLeft className="h-4 w-4" /> Staff login
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {ticket ? (
          <TrackingView ticket={ticket} isPublic />
        ) : (
          <div className="space-y-5">
            <Card className="p-6">
              <h1 className="text-lg font-bold text-ink-900">Track your parcel</h1>
              <p className="mt-1 text-sm text-ink-500">Enter your ticket ID to see where your parcel is on its journey.</p>
              <form
                className="mt-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!query.trim()) return
                  window.location.hash = `#/track/${encodeURIComponent(query.trim())}`
                  toast.info('Searching…', query.trim())
                }}
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. MBR-2026-000184" className="pl-10 font-mono" autoFocus />
                  </div>
                  <Button type="submit">Track</Button>
                </div>
              </form>
            </Card>

            <Card className="p-6">
              <EmptyState
                icon={<PackageCheck className="h-6 w-6" />}
                title={decoded ? `No parcel found for ${decoded}` : 'Enter a ticket ID'}
                description="We couldn't find a parcel with that ticket ID. Check the number and try again."
                action={<Button variant="outline" onClick={() => { setQuery('MBR-2026-000184'); window.location.hash = '#/track/MBR-2026-000184' }}>Try example: MBR-2026-000184</Button>}
              />
            </Card>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-8 pt-2 text-center text-xs text-ink-400">
        ParcelFlow — smart parcel ticketing and tracking for modern bus parks.
      </footer>
    </div>
  )
}
