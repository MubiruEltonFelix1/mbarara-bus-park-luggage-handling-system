import { useMemo, useState } from 'react'
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Package,
  X,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { useToast } from '../components/ui/Toast'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Field, Input, Select } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import type { Ticket } from '../types'
import { formatDateTime, formatTime, relativeTime } from '../lib/utils'

export function Dispatch() {
  const { tickets, bulkUpdateStatus, settings } = useApp()
  const toast = useToast()

  const [view, setView] = useState<'waiting' | 'history'>('waiting')
  const [groupBy, setGroupBy] = useState<'destination' | 'vehicle'>('destination')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [vehicle, setVehicle] = useState('')
  const [departure, setDeparture] = useState(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  })
  const [driver, setDriver] = useState('')

  const waiting = useMemo(
    () => tickets.filter((t) => t.status === 'Received' || t.status === 'Awaiting dispatch'),
    [tickets],
  )
  const history = useMemo(
    () =>
      [...tickets]
        .filter((t) => t.statusHistory.some((h) => h.status === 'In transit'))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .slice(0, 30),
    [tickets],
  )

  const groups = useMemo(() => {
    const map = new Map<string, Ticket[]>()
    waiting.forEach((t) => {
      const key = groupBy === 'destination' ? t.destination : t.vehiclePlate
      const arr = map.get(key) ?? []
      arr.push(t)
      map.set(key, arr)
    })
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [waiting, groupBy])

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  const toggleGroup = (key: string, ids: string[]) => {
    setSelected((s) => {
      const n = new Set(s)
      const allSelected = ids.every((id) => n.has(id))
      ids.forEach((id) => (allSelected ? n.delete(id) : n.add(id)))
      return n
    })
  }
  const toggleCollapse = (key: string) => {
    setCollapsed((s) => {
      const n = new Set(s)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  }

  const confirmDispatch = () => {
    const ids = [...selected]
    bulkUpdateStatus(ids, 'In transit', settings.attendants[0]?.name ?? 'Staff', `Departed ${formatTime(departure)}`, vehicle || undefined)
    toast.success(`${ids.length} parcel${ids.length === 1 ? '' : 's'} dispatched`, `Marked in transit on ${vehicle || 'vehicle'}.`)
    setSelected(new Set())
    setDispatchOpen(false)
    setVehicle('')
    setDriver('')
  }

  const selectedTickets = tickets.filter((t) => selected.has(t.id))

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <PageHeader
        title="Dispatch"
        subtitle={`${waiting.length} parcel${waiting.length === 1 ? '' : 's'} waiting to be dispatched`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={view}
          onChange={(v) => setView(v as 'waiting' | 'history')}
          options={[{ label: 'Waiting', value: 'waiting' }, { label: 'History', value: 'history' }]}
        />
        {view === 'waiting' && (
          <SegmentedControl
            size="sm"
            value={groupBy}
            onChange={(v) => setGroupBy(v as 'destination' | 'vehicle')}
            options={[
              { label: 'By destination', value: 'destination' },
              { label: 'By vehicle', value: 'vehicle' },
            ]}
          />
        )}
      </div>

      {view === 'waiting' && (
        <>
          {waiting.length === 0 ? (
            <Card>
              <EmptyState icon={<CheckCircle2 className="h-6 w-6" />} title="Nothing waiting for dispatch" description="All received parcels have been dispatched. Great work!" />
            </Card>
          ) : (
            <div className="space-y-3">
              {groups.map(([key, items]) => {
                const ids = items.map((t) => t.id)
                const allSelected = ids.every((id) => selected.has(id))
                const isCollapsed = collapsed.has(key)
                return (
                  <Card key={key}>
                    <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
                      <button onClick={() => toggleCollapse(key)} className="flex items-center gap-2 text-left">
                        {isCollapsed ? <ChevronRight className="h-4 w-4 text-ink-400" /> : <ChevronDown className="h-4 w-4 text-ink-400" />}
                        {groupBy === 'destination' ? (
                          <MapPin className="h-4 w-4 text-brand-600" />
                        ) : (
                          <Truck className="h-4 w-4 text-brand-600" />
                        )}
                        <span className="font-semibold text-ink-900">{key}</span>
                        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">{items.length}</span>
                      </button>
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-600">
                        <input type="checkbox" checked={allSelected} onChange={() => toggleGroup(key, ids)} className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
                        Select all
                      </label>
                    </div>
                    {!isCollapsed && (
                      <div className="divide-y divide-ink-100">
                        {items.map((t) => (
                          <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50">
                            <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" />
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-ink-50 text-xs font-bold text-ink-600">{t.itemType.slice(0, 2).toUpperCase()}</div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-ink-900">{t.senderName} → {t.receiverName}</p>
                              <p className="truncate font-mono text-xs text-ink-500">{t.id} · {t.originPark} → {t.destination} · {t.vehiclePlate}</p>
                            </div>
                            <StatusBadge status={t.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {view === 'history' && (
        <Card>
          {history.length === 0 ? (
            <EmptyState icon={<Truck className="h-6 w-6" />} title="No dispatch history yet" description="Dispatched parcels will appear here." />
          ) : (
            <div className="divide-y divide-ink-100">
              {history.map((t) => {
                const dispatch = [...t.statusHistory].reverse().find((h) => h.status === 'In transit')
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Truck className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{t.id} · {t.destination}</p>
                      <p className="text-xs text-ink-500">{dispatch ? `Dispatched ${relativeTime(dispatch.timestamp)}` : formatDateTime(t.updatedAt)} · {t.vehiclePlate}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-16 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 lg:bottom-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3 shadow-pop animate-slide-up">
            <div className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{selected.size}</span>
              selected
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} leftIcon={<X className="h-4 w-4" />}>Clear</Button>
              <Button size="sm" leftIcon={<Truck className="h-4 w-4" />} onClick={() => setDispatchOpen(true)}>Dispatch</Button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch confirmation modal */}
      <Modal
        open={dispatchOpen}
        onClose={() => setDispatchOpen(false)}
        title="Confirm dispatch"
        description={`Dispatching ${selected.size} parcel${selected.size === 1 ? '' : 's'}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDispatchOpen(false)}>Cancel</Button>
            <Button onClick={confirmDispatch} leftIcon={<CheckCircle2 className="h-4 w-4" />}>Mark dispatched</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-ink-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Selected parcels</p>
            <div className="max-h-32 space-y-1 overflow-y-auto scrollbar-thin">
              {selectedTickets.map((t) => (
                <p key={t.id} className="font-mono text-xs text-ink-600">{t.id} → {t.destination}</p>
              ))}
            </div>
          </div>
          <Field label="Vehicle plate" htmlFor="vehicle" required>
            <Input id="vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value.toUpperCase())} placeholder="e.g. UBA 123X" />
          </Field>
          <Field label="Departure time" htmlFor="departure" required>
            <Input id="departure" type="datetime-local" value={departure} onChange={(e) => setDeparture(e.target.value)} />
          </Field>
          <Field label="Driver or conductor (optional)" htmlFor="driver">
            <Input id="driver" value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="e.g. John, Kalita Coaches" />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
