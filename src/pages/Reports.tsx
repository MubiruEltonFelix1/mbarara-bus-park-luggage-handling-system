import { useMemo, useState } from 'react'
import {
  Package,
  PackageCheck,
  Wallet,
  Clock,
  AlertTriangle,
  Route as RouteIcon,
  TrendingUp,
  Download,
  Printer,
  Users,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { usePrint } from '../store/PrintProvider'
import { useToast } from '../components/ui/Toast'
import { PageHeader } from '../components/layout/PageHeader'
import { StatCard } from '../components/dashboard/StatCard'
import { DateFilter } from '../components/dashboard/DateFilter'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { BarChart, HBarList } from '../components/charts/BarChart'
import { DonutChart } from '../components/charts/DonutChart'
import { Modal } from '../components/ui/Modal'
import { Field, Input } from '../components/ui/Field'
import type { DateFilterKey } from '../types'
import {
  averageDeliveryHours,
  countByDestination,
  dateRangeFromKey,
  filterByDate,
  paymentMethodBreakdown,
  popularRoutes,
  revenueByAttendant,
  revenueByDestination,
} from '../lib/stats'
import { downloadFile, formatUGX, formatUGXShort, ticketsToCSV } from '../lib/utils'

export function Reports() {
  const { tickets } = useApp()
  const toast = useToast()
  const [filter, setFilter] = useState<DateFilterKey>('this_week')
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState<{ from?: string; to?: string }>({})

  const range = useMemo(() => dateRangeFromKey(filter, custom), [filter, custom])
  const scoped = useMemo(() => filterByDate(tickets, range), [tickets, range])

  const created = scoped.length
  const delivered = scoped.filter((t) => t.status === 'Collected').length
  const revenue = scoped.filter((t) => t.paymentStatus === 'Paid').reduce((s, t) => s + t.fee, 0)
  const pendingRevenue = scoped.filter((t) => t.paymentStatus !== 'Paid').reduce((s, t) => s + t.fee, 0)
  const delayed = scoped.filter((t) => t.status === 'Delayed').length
  const avgHours = averageDeliveryHours(scoped)

  const destRevenue = useMemo(() => revenueByDestination(scoped), [scoped])
  const destCount = useMemo(() => countByDestination(scoped).slice(0, 6), [scoped])
  const attendantRevenue = useMemo(() => revenueByAttendant(scoped), [scoped])
  const routes = useMemo(() => popularRoutes(scoped), [scoped])
  const payments = useMemo(() => paymentMethodBreakdown(scoped), [scoped])

  const exportCSV = () => {
    downloadFile(`parcelflow-report-${new Date().toISOString().slice(0, 10)}.csv`, ticketsToCSV(scoped), 'text/csv')
    toast.success('Report exported', `${scoped.length} tickets exported to CSV.`)
  }

  return (
    <div className="space-y-5 print-area">
      <PageHeader
        title="Reports"
        subtitle="Performance and revenue insights for your park"
        actions={
          <>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCSV}>Export CSV</Button>
            <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Print</Button>
          </>
        }
      />

      <DateFilter
        value={filter}
        onChange={(v) => {
          setFilter(v)
          if (v === 'custom') setCustomOpen(true)
        }}
      />

      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Tickets created" value={String(created)} icon={Package} tone="brand" />
        <StatCard label="Delivered" value={String(delivered)} icon={PackageCheck} tone="green" />
        <StatCard label="Revenue collected" value={formatUGXShort(revenue)} icon={Wallet} tone="brand" />
        <StatCard label="Pending revenue" value={formatUGXShort(pendingRevenue)} icon={Clock} tone="amber" />
        <StatCard label="Delayed" value={String(delayed)} icon={AlertTriangle} tone={delayed > 0 ? 'red' : 'gray'} />
        <StatCard label="Avg delivery" value={avgHours ? `${avgHours.toFixed(1)}h` : '—'} icon={TrendingUp} tone="blue" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by destination */}
        <Card>
          <CardHeader><CardTitle>Revenue by destination</CardTitle></CardHeader>
          <CardContent>
            {destRevenue.length === 0 ? (
              <EmptyState icon={<Wallet className="h-6 w-6" />} title="No data" description="No tickets in this period." />
            ) : (
              <HBarList data={destRevenue} formatValue={(v) => formatUGX(v)} />
            )}
          </CardContent>
        </Card>

        {/* Tickets by destination */}
        <Card>
          <CardHeader><CardTitle>Tickets by destination</CardTitle></CardHeader>
          <CardContent>
            {destCount.length === 0 ? (
              <EmptyState icon={<Package className="h-6 w-6" />} title="No data" />
            ) : (
              <BarChart data={destCount.map((d) => ({ ...d, sublabel: '' }))} formatValue={(v) => `${v} tickets`} color="bg-brand-500" />
            )}
          </CardContent>
        </Card>

        {/* Revenue by attendant */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-ink-400" /> Revenue by attendant</CardTitle></CardHeader>
          <CardContent>
            {attendantRevenue.length === 0 ? (
              <EmptyState icon={<Users className="h-6 w-6" />} title="No data" />
            ) : (
              <HBarList data={attendantRevenue} formatValue={(v) => formatUGX(v)} />
            )}
          </CardContent>
        </Card>

        {/* Payment method breakdown */}
        <Card>
          <CardHeader><CardTitle>Payment method breakdown</CardTitle></CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <EmptyState icon={<Wallet className="h-6 w-6" />} title="No data" />
            ) : (
              <DonutChart data={payments} centerLabel="payments" formatValue={(v) => `${v}`} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular routes */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><RouteIcon className="h-4 w-4 text-ink-400" /> Popular routes</CardTitle></CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <EmptyState icon={<RouteIcon className="h-6 w-6" />} title="No data" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {routes.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-ink-100 p-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-800">{r.label}</p>
                    <p className="text-xs text-ink-400">{r.value} ticket{r.value === 1 ? '' : 's'}</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">#{i + 1}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom range modal */}
      <Modal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        title="Custom date range"
        footer={
          <>
            <Button variant="outline" onClick={() => setCustomOpen(false)}>Cancel</Button>
            <Button onClick={() => { setCustomOpen(false); setFilter('custom') }} disabled={!custom.from}>Apply</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" htmlFor="rfrom"><Input id="rfrom" type="date" value={custom.from ?? ''} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} /></Field>
          <Field label="To" htmlFor="rto"><Input id="rto" type="date" value={custom.to ?? ''} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} /></Field>
        </div>
      </Modal>
    </div>
  )
}
