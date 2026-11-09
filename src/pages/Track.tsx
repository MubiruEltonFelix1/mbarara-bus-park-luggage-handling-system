import { useState } from 'react'
import { Search, MapPin, History, X, PackageCheck } from 'lucide-react'
import { useApp } from '../store/AppStore'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { TrackingView } from '../components/tickets/TrackingView'
import { load, save } from '../lib/storage'
import { useToast } from '../components/ui/Toast'

const RECENT_KEY = 'recentTrackSearches'

export function Track() {
  const { getTicket } = useApp()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [recent, setRecent] = useState<string[]>(() => load<string[]>(RECENT_KEY, []))

  const doSearch = (id: string) => {
    const clean = id.trim()
    if (!clean) return
    const t = getTicket(clean)
    if (t) {
      setResult(t.id)
      setNotFound(false)
      const next = [t.id, ...recent.filter((r) => r !== t.id)].slice(0, 6)
      setRecent(next)
      save(RECENT_KEY, next)
    } else {
      setResult(null)
      setNotFound(true)
      toast.error('Ticket not found', `No parcel matches "${clean}".`)
    }
  }

  const ticket = result ? getTicket(result) : undefined

  if (ticket) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Button variant="ghost" leftIcon={<X className="h-4 w-4" />} onClick={() => { setResult(null); setQuery('') }}>
            New search
          </Button>
        </div>
        <TrackingView ticket={ticket} isPublic={false} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title="Track parcel" subtitle="Look up a parcel by its ticket ID" />
      <Card className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            doSearch(query)
          }}
        >
          <label htmlFor="trackId" className="mb-1.5 block text-sm font-medium text-ink-700">Ticket ID</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input id="trackId" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. MBR-2026-000184" className="pl-10 font-mono" autoFocus />
            </div>
            <Button type="submit">Track</Button>
          </div>
          <p className="mt-2 text-xs text-ink-400">Enter the ticket ID printed on the parcel ticket or scan the QR code.</p>
        </form>

        {notFound && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            We couldn't find a parcel with that ticket ID. Check the number and try again.
          </div>
        )}

        {recent.length > 0 && (
          <div className="mt-5 border-t border-ink-100 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-400">
              <History className="h-3.5 w-3.5" /> Recent searches
            </p>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  key={r}
                  onClick={() => { setQuery(r); doSearch(r) }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 font-mono text-xs font-medium text-ink-700 hover:border-brand-400 hover:bg-brand-50"
                >
                  <PackageCheck className="h-3.5 w-3.5 text-brand-600" /> {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardContent>
          <EmptyState
            icon={<MapPin className="h-6 w-6" />}
            title="Try the example ticket"
            description="Search for MBR-2026-000184 to see a live tracked parcel on its journey."
            action={<Button variant="outline" onClick={() => { setQuery('MBR-2026-000184'); doSearch('MBR-2026-000184') }}>Load example</Button>}
          />
        </CardContent>
      </Card>
    </div>
  )
}
