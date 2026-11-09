import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  Package,
  Eye,
  Printer,
  Share2,
  ArrowUpDown,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { usePrint } from '../store/PrintProvider'
import { useToast } from '../components/ui/Toast'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import { StatusBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'
import { Modal } from '../components/ui/Modal'
import type { PaymentStatus, Ticket, TicketStatus } from '../types'
import { TICKET_STATUSES, PAYMENT_STATUSES } from '../types'
import { copyToClipboard, formatDateTime, formatUGX, ticketsToCSV, downloadFile } from '../lib/utils'
import { trackingUrl } from '../lib/qr'

type SortKey = 'newest' | 'oldest' | 'fee_desc' | 'fee_asc' | 'status'
const PAGE_SIZE = 8

export function AllTickets() {
  const { tickets } = useApp()
  const { printTicket } = usePrint()
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all')
  const [destinationFilter, setDestinationFilter] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearch(q)
  }, [searchParams])

  const destinations = useMemo(() => [...new Set(tickets.map((t) => t.destination))].sort(), [tickets])

  const filtered = useMemo(() => {
    let list = [...tickets]
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.senderName.toLowerCase().includes(q) ||
          t.receiverName.toLowerCase().includes(q) ||
          t.senderPhone.toLowerCase().includes(q) ||
          t.receiverPhone.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          t.vehiclePlate.toLowerCase().includes(q),
      )
    }
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter)
    if (paymentFilter !== 'all') list = list.filter((t) => t.paymentStatus === paymentFilter)
    if (destinationFilter !== 'all') list = list.filter((t) => t.destination === destinationFilter)

    list.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return a.createdAt < b.createdAt ? 1 : -1
        case 'oldest':
          return a.createdAt > b.createdAt ? 1 : -1
        case 'fee_desc':
          return b.fee - a.fee
        case 'fee_asc':
          return a.fee - b.fee
        case 'status':
          return a.status.localeCompare(b.status)
      }
    })
    return list
  }, [tickets, search, statusFilter, paymentFilter, destinationFilter, sort])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  useEffect(() => setPage(1), [search, statusFilter, paymentFilter, destinationFilter, sort])

  const exportCSV = () => {
    downloadFile(`parcelflow-tickets-${new Date().toISOString().slice(0, 10)}.csv`, ticketsToCSV(filtered), 'text/csv')
    toast.success('Exported to CSV', `${filtered.length} ticket${filtered.length === 1 ? '' : 's'} downloaded.`)
  }

  const shareLink = async (t: Ticket) => {
    await copyToClipboard(trackingUrl(t.id))
    toast.success('Tracking link copied', t.id)
  }

  const activeFilterCount = [statusFilter !== 'all', paymentFilter !== 'all', destinationFilter !== 'all'].filter(Boolean).length
  const clearFilters = () => {
    setStatusFilter('all')
    setPaymentFilter('all')
    setDestinationFilter('all')
    setSearch('')
  }

  const Filters = () => (
    <div className="grid gap-3 sm:grid-cols-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-600">Status</label>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}>
          <option value="all">All statuses</option>
          {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-600">Payment status</label>
        <Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'all')}>
          <option value="all">All payments</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-600">Destination</label>
        <Select value={destinationFilter} onChange={(e) => setDestinationFilter(e.target.value)}>
          <option value="all">All destinations</option>
          {destinations.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="All tickets"
        subtitle={`${tickets.length} tickets in history`}
        actions={
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCSV}>
            Export CSV
          </Button>
        }
      />

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticket ID, sender, phone, destination, plate…" className="pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="pr-9 sm:w-44">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="fee_desc">Fee: high to low</option>
                <option value="fee_asc">Fee: low to high</option>
                <option value="status">Status A–Z</option>
              </Select>
            </div>
            <Button variant="outline" leftIcon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setFiltersOpen(true)} className="lg:hidden">
              Filters
              {activeFilterCount > 0 && <span className="ml-1 rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">{activeFilterCount}</span>}
            </Button>
          </div>
        </div>

        {/* Desktop filters inline */}
        <div className="mt-4 hidden lg:block">
          <Filters />
        </div>

        {/* Active filter chips */}
        {(activeFilterCount > 0 || search) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {search && <Chip label={`Search: "${search}"`} onClear={() => setSearch('')} />}
            {statusFilter !== 'all' && <Chip label={statusFilter} onClear={() => setStatusFilter('all')} />}
            {paymentFilter !== 'all' && <Chip label={paymentFilter} onClear={() => setPaymentFilter('all')} />}
            {destinationFilter !== 'all' && <Chip label={destinationFilter} onClear={() => setDestinationFilter('all')} />}
            <button onClick={clearFilters} className="text-xs font-medium text-brand-600 hover:text-brand-700">Clear all</button>
          </div>
        )}
      </Card>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="No tickets found"
            description="Try adjusting your search or filters."
            action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
          />
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    <th className="px-5 py-3">Ticket</th>
                    <th className="px-5 py-3">Sender → Receiver</th>
                    <th className="px-5 py-3">Destination</th>
                    <th className="px-5 py-3">Vehicle</th>
                    <th className="px-5 py-3">Fee</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {paged.map((t) => (
                    <tr key={t.id} className="group hover:bg-ink-50">
                      <td className="px-5 py-3">
                        <button onClick={() => navigate(`/tickets/${t.id}`)} className="text-left">
                          <span className="font-mono text-xs font-bold text-ink-900">{t.id}</span>
                          <span className="block text-[11px] text-ink-400">{formatDateTime(t.createdAt)}</span>
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-ink-700">{t.senderName}</span>
                        <span className="text-ink-400"> → </span>
                        <span className="text-ink-700">{t.receiverName}</span>
                      </td>
                      <td className="px-5 py-3 text-ink-700">{t.destination}</td>
                      <td className="px-5 py-3 font-mono text-xs text-ink-700">{t.vehiclePlate}</td>
                      <td className="px-5 py-3 font-semibold text-ink-900">{formatUGX(t.fee)}</td>
                      <td className="px-5 py-3 text-ink-600">{t.paymentStatus}</td>
                      <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                          <IconBtn title="View" onClick={() => navigate(`/tickets/${t.id}`)}><Eye className="h-4 w-4" /></IconBtn>
                          <IconBtn title="Print" onClick={() => printTicket(t)}><Printer className="h-4 w-4" /></IconBtn>
                          <IconBtn title="Share link" onClick={() => shareLink(t)}><Share2 className="h-4 w-4" /></IconBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {paged.map((t) => (
              <Card key={t.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => navigate(`/tickets/${t.id}`)} className="text-left">
                    <span className="font-mono text-xs font-bold text-ink-900">{t.id}</span>
                    <p className="mt-0.5 text-sm font-semibold text-ink-800">{t.senderName} → {t.receiverName}</p>
                    <p className="text-xs text-ink-500">{t.destination} · {t.vehiclePlate}</p>
                  </button>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-ink-900">{formatUGX(t.fee)}</p>
                    <p className="text-[11px] text-ink-400">{t.paymentStatus} · {formatDateTime(t.createdAt)}</p>
                  </div>
                  <div className="flex gap-1">
                    <IconBtn title="View" onClick={() => navigate(`/tickets/${t.id}`)}><Eye className="h-4 w-4" /></IconBtn>
                    <IconBtn title="Print" onClick={() => printTicket(t)}><Printer className="h-4 w-4" /></IconBtn>
                    <IconBtn title="Share" onClick={() => shareLink(t)}><Share2 className="h-4 w-4" /></IconBtn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-400">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </div>
      )}

      {/* Mobile filters modal */}
      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" size="md"
        footer={<><Button variant="outline" onClick={clearFilters}>Clear all</Button><Button onClick={() => setFiltersOpen(false)}>Apply</Button></>}>
        <Filters />
      </Modal>
    </div>
  )
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
      {label}
      <button onClick={onClear} className="rounded-full hover:bg-brand-100"><X className="h-3 w-3" /></button>
    </span>
  )
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900">
      {children}
    </button>
  )
}
