import type { Ticket, TicketStatus } from '../../types'
import { STATUS_FLOW } from '../../types'
import { Badge, StatusBadge } from '../ui/Badge'
import { QRImage } from '../ui/QRImage'
import { trackingUrl } from '../../lib/qr'
import {
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Truck,
  Phone,
  User,
  Package,
  Weight,
  XCircle,
  MapPinned,
  CalendarClock,
} from 'lucide-react'
import { cn, formatDate, formatDateTime, maskName, maskPhone, relativeTime } from '../../lib/utils'

/** Shared parcel tracking view. `public` toggles privacy masking. */
export function TrackingView({ ticket, isPublic }: { ticket: Ticket; isPublic: boolean }) {
  const reachedStatuses = new Set(ticket.statusHistory.map((h) => h.status))
  const isCancelled = ticket.status === 'Cancelled'
  const isDelayed = ticket.status === 'Delayed'

  const name = (n: string) => (isPublic ? maskName(n) : n)
  const phone = (p: string) => (isPublic ? maskPhone(p) : p)

  const historyByStatus = new Map<string, string>()
  ticket.statusHistory.forEach((h) => historyByStatus.set(h.status, h.timestamp))

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
        <div className="flex flex-col gap-3 bg-ink-900 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-ink-300">
              <MapPinned className="h-4 w-4 text-brand-400" /> ParcelFlow Tracking
            </div>
            <p className="mt-1 font-mono text-lg font-bold tracking-tight">{ticket.id}</p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            {/* Journey */}
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 p-4">
              <div className="flex flex-col items-center">
                <MapPin className="h-5 w-5 text-brand-600" />
                <span className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">From</span>
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs text-ink-400">In transit to</p>
                <div className="my-1 flex items-center justify-center gap-1 text-ink-300">
                  <span className="h-px flex-1 border-t border-dashed" />
                  <Truck className="h-4 w-4" />
                  <span className="h-px flex-1 border-t border-dashed" />
                </div>
                <p className="text-[11px] text-ink-400">{ticket.vehiclePlate}</p>
              </div>
              <div className="flex flex-col items-center">
                <MapPin className="h-5 w-5 text-amber-500" />
                <span className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">To</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-ink-50 p-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-ink-400">Origin</p>
                <p className="text-sm font-semibold text-ink-800">{ticket.originPark}</p>
              </div>
              <div className="rounded-lg bg-ink-50 p-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-ink-400">Destination</p>
                <p className="text-sm font-semibold text-ink-800">{ticket.destination}</p>
              </div>
            </div>

            {/* People */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <InfoRow icon={<User className="h-4 w-4 text-brand-600" />} label="Sender" value={name(ticket.senderName)} sub={phone(ticket.senderPhone)} />
              <InfoRow icon={<User className="h-4 w-4 text-amber-500" />} label="Receiver" value={name(ticket.receiverName)} sub={phone(ticket.receiverPhone)} />
            </div>

            {/* Parcel meta */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <InfoRow icon={<Package className="h-4 w-4 text-ink-400" />} label="Type" value={`${ticket.itemType} ×${ticket.itemCount}`} />
              <InfoRow icon={<Weight className="h-4 w-4 text-ink-400" />} label="Weight" value={`${ticket.weightKg} kg`} />
              <InfoRow icon={<Truck className="h-4 w-4 text-ink-400" />} label="Vehicle" value={ticket.vehiclePlate} />
            </div>
            {ticket.expectedArrival && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink-100 bg-ink-50 p-3 text-sm">
                <CalendarClock className="h-4 w-4 text-ink-400" />
                <span className="text-ink-500">Expected arrival:</span>
                <span className="font-medium text-ink-800">{formatDate(ticket.expectedArrival)}</span>
              </div>
            )}
            {isPublic && (
              <p className="mt-3 text-[11px] text-ink-400">For privacy, sender and receiver details are partially hidden on this public page.</p>
            )}
          </div>

          {/* QR */}
          <div className="flex flex-col items-center gap-2 sm:w-40">
            <div className="rounded-xl border border-ink-100 p-3 text-center">
              <QRImage value={trackingUrl(ticket.id)} size={120} className="rounded-md" />
              <p className="mt-2 text-[10px] text-ink-400">Scan to open this page</p>
            </div>
            {!isPublic && (
              <a href={`#/track/${encodeURIComponent(ticket.id)}`} className="text-center text-[11px] font-medium text-brand-600 hover:text-brand-700">
                Open public view
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-ink-800">Journey timeline</h2>
        <ol className="space-y-1">
          {STATUS_FLOW.map((status, i) => {
            const reached = reachedStatuses.has(status)
            const ts = historyByStatus.get(status)
            const current = ticket.status === status
            return (
              <li key={status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {reached ? (
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', current ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-600')}>
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink-200 bg-white text-ink-300">
                      <Circle className="h-3 w-3" />
                    </span>
                  )}
                  {i < STATUS_FLOW.length - 1 && <span className={cn('my-1 w-0.5 flex-1', reached ? 'bg-brand-300' : 'bg-ink-200')} style={{ minHeight: 20 }} />}
                </div>
                <div className={cn('pb-4', !reached && 'opacity-50')}>
                  <p className={cn('text-sm font-medium', reached ? 'text-ink-900' : 'text-ink-500')}>{status}</p>
                  {ts ? <p className="text-xs text-ink-400">{formatDateTime(ts)}</p> : <p className="text-xs text-ink-400">Pending</p>}
                </div>
              </li>
            )
          })}
          {isDelayed && (
            <li className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Clock className="h-4 w-4" /></span>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700">Delayed</p>
                <p className="text-xs text-ink-400">{formatDateTime(historyByStatus.get('Delayed') ?? ticket.updatedAt)}</p>
              </div>
            </li>
          )}
          {isCancelled && (
            <li className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-600"><XCircle className="h-4 w-4" /></span>
              </div>
              <div>
                <p className="text-sm font-medium text-red-600">Cancelled</p>
                <p className="text-xs text-ink-400">{formatDateTime(historyByStatus.get('Cancelled') ?? ticket.updatedAt)}</p>
              </div>
            </li>
          )}
        </ol>

        {isCancelled && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            This parcel was cancelled. Contact the park office for more information.
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
        <h2 className="mb-2 text-sm font-semibold text-ink-800">Contact the park office</h2>
        <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-ink-800">{ticket.parkName}</p>
            <p className="text-ink-500">For help with this parcel, quote ticket ID {ticket.id}.</p>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-ink-400" />
            <span className="font-medium text-ink-700">+256 700 000 000</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-ink-100 p-2.5">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-400">{icon} {label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-ink-800">{value}</p>
      {sub && <p className="truncate text-xs text-ink-500">{sub}</p>}
    </div>
  )
}
