import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  Truck,
  PackageCheck,
  Clock,
  Wallet,
  AlertTriangle,
  Plus,
  MapPin,
  ArrowRight,
  Activity,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { PageHeader } from '../components/layout/PageHeader'
import { StatCard } from '../components/dashboard/StatCard'
import { DateFilter } from '../components/dashboard/DateFilter'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { Field, Input } from '../components/ui/Field'
import { AreaChart } from '../components/charts/AreaChart'
import { HBarList } from '../components/charts/BarChart'
import type { DateFilterKey } from '../types'
import {
  computeDashboardStats,
  dateRangeFromKey,
  filterByDate,
  revenueByDestination,
  ticketsByDay,
} from '../lib/stats'
import { formatDateTime, formatUGX, formatUGXShort, relativeTime } from '../lib/utils'

export function Dashboard() {
  const { tickets, loading } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<DateFilterKey>('today')
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState<{ from?: string; to?: string }>({})

  const range = useMemo(() => dateRangeFromKey(filter, custom), [filter, custom])
  const scoped = useMemo(() => filterByDate(tickets, range), [tickets, range])
  const stats = useMemo(() => computeDashboardStats(scoped), [scoped])
  const volume = useMemo(() => ticketsByDay(tickets, 7), [tickets])
  const destSummary = useMemo(() => revenueByDestination(scoped), [scoped])
  const recent = useMemo(() => [...scoped].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6), [scoped])
  const activity = useMemo(
    () =>
      [...scoped]
        .flatMap((t) => t.statusHistory.map((h) => ({ ...h, ticketId: t.id })))
        .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
        .slice(0, 7),
    [scoped],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of parcel activity and park operations"
        actions={
          <>
            <Button variant="outline" leftIcon={<MapPin className="h-4 w-4" />} onClick={() => navigate('/track')}>
              Track parcel
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/tickets/new')}>
              New ticket
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateFilter
          value={filter}
          onChange={(v) => {
            setFilter(v)
            if (v === 'custom') setCustomOpen(true)
          }}
          onCustom={(from, to) => {
            setCustom({ from, to })
            setFilter('custom')
          }}
        />
        <p className="text-xs text-ink-400">
          Showing {scoped.length} ticket{scoped.length === 1 ? '' : 's'} · {relativeTime(range.start.toISOString())} → today
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Tickets today" value={String(stats.totalToday)} icon={Package} tone="brand" />
        <StatCard label="In transit" value={String(stats.inTransit)} icon={Truck} tone="blue" />
        <StatCard label="Delivered" value={String(stats.delivered)} icon={PackageCheck} tone="green" />
        <StatCard label="Pending dispatch" value={String(stats.pendingDispatch)} icon={Clock} tone="amber" />
        <StatCard label="Revenue today" value={formatUGXShort(stats.revenueToday)} icon={Wallet} tone="brand" />
        <StatCard label="Delayed" value={String(stats.delayed)} icon={AlertTriangle} tone={stats.delayed > 0 ? 'red' : 'gray'} />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ticket volume</CardTitle>
            <span className="text-xs text-ink-400">Last 7 days</span>
          </CardHeader>
          <CardContent>
            <AreaChart data={volume} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by destination</CardTitle>
          </CardHeader>
          <CardContent>
            {destSummary.length === 0 ? (
              <EmptyState icon={<MapPin className="h-6 w-6" />} title="No data" description="No tickets in this period." />
            ) : (
              <HBarList data={destSummary} formatValue={(v) => formatUGXShort(v)} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent + activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent tickets</CardTitle>
            <button onClick={() => navigate('/tickets')} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <EmptyState
                icon={<Package className="h-6 w-6" />}
                title="No recent tickets"
                description="Create a ticket to see it here."
                action={<Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/tickets/new')}>New ticket</Button>}
              />
            ) : (
              <div className="divide-y divide-ink-100">
                {recent.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-ink-50"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-ink-50 text-xs font-bold text-ink-600">
                      {t.itemType.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{t.senderName} → {t.receiverName}</p>
                      <p className="truncate text-xs text-ink-500">
                        {t.id} · {t.destination} · {t.vehiclePlate}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold text-ink-900">{formatUGX(t.fee)}</p>
                      <p className="text-[11px] text-ink-400">{formatDateTime(t.createdAt)}</p>
                    </div>
                    <StatusBadge status={t.status} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activity.length === 0 ? (
              <EmptyState icon={<Activity className="h-6 w-6" />} title="No activity" description="Status updates will appear here." />
            ) : (
              <div className="p-5">
                <ol className="relative space-y-4 border-l border-ink-200 pl-5">
                  {activity.map((a, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white bg-brand-500" />
                      <button onClick={() => navigate(`/tickets/${a.ticketId}`)} className="text-left">
                        <p className="text-sm font-medium text-ink-800">
                          {a.status} <span className="font-mono text-xs text-ink-400">· {a.ticketId}</span>
                        </p>
                        <p className="text-xs text-ink-400">{relativeTime(a.timestamp)} · {a.staff}</p>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom range modal */}
      <Modal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        title="Custom date range"
        description="Filter tickets created within a date range"
        footer={
          <>
            <Button variant="outline" onClick={() => setCustomOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setCustomOpen(false)
                setFilter('custom')
              }}
              disabled={!custom.from}
            >
              Apply filter
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" htmlFor="from">
            <Input id="from" type="date" value={custom.from ?? ''} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
          </Field>
          <Field label="To" htmlFor="to">
            <Input id="to" type="date" value={custom.to ?? ''} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
          </Field>
        </div>
      </Modal>

      {loading && <p className="sr-only">Loading tickets…</p>}
    </div>
  )
}
