import type { Ticket } from '../../types'
import { Badge, StatusBadge } from '../ui/Badge'
import { formatDateTime, formatDate, formatUGX } from '../../lib/utils'
import { QRImage } from '../ui/QRImage'
import { trackingUrl } from '../../lib/qr'
import { Package, User, Phone, MapPin, Truck, Wallet, Boxes, Weight, ShieldCheck } from 'lucide-react'

/** Large modern ticket card for dashboard / PDF / WhatsApp sharing. */
export function DigitalTicket({ ticket, copyLabel, qrUrl }: { ticket: Ticket; copyLabel: string; qrUrl?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
      {/* Top banner */}
      <div className="flex items-center justify-between gap-3 bg-ink-900 px-5 py-4 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
            <Package className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-extrabold tracking-tight">ParcelFlow</p>
            <p className="text-[11px] text-ink-300">{ticket.parkName}</p>
          </div>
        </div>
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
          {copyLabel}
        </span>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          {/* ID + status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-ink-400">Ticket ID</p>
              <p className="font-mono text-lg font-bold tracking-tight text-ink-900">{ticket.id}</p>
            </div>
            <StatusBadge status={ticket.status} />
          </div>

          {/* Journey */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50 p-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-400">From</p>
                <p className="text-sm font-semibold text-ink-800">{ticket.originPark}</p>
              </div>
            </div>
            <div className="flex-1 border-t border-dashed border-ink-300" />
            <Truck className="h-4 w-4 text-ink-400" />
            <div className="flex-1 border-t border-dashed border-ink-300" />
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-400">To</p>
                <p className="text-sm font-semibold text-ink-800">{ticket.destination}</p>
              </div>
            </div>
          </div>

          {/* Sender / receiver */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Detail icon={<User className="h-3.5 w-3.5" />} label="Sender" value={ticket.senderName} sub={<span className="flex items-center gap-1"><Phone className="h-3 w-3" />{ticket.senderPhone}</span>} />
            <Detail icon={<User className="h-3.5 w-3.5" />} label="Receiver" value={ticket.receiverName} sub={<span className="flex items-center gap-1"><Phone className="h-3 w-3" />{ticket.receiverPhone}</span>} />
          </div>

          {/* Parcel info */}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Detail icon={<Boxes className="h-3.5 w-3.5" />} label="Type" value={`${ticket.itemType} ×${ticket.itemCount}`} />
            <Detail icon={<Weight className="h-3.5 w-3.5" />} label="Weight" value={`${ticket.weightKg} kg`} />
            <Detail icon={<Truck className="h-3.5 w-3.5" />} label="Vehicle" value={ticket.vehiclePlate} />
            <Detail icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Created" value={formatDate(ticket.createdAt)} />
          </div>

          {ticket.description && (
            <div className="mt-3 rounded-lg border border-ink-100 bg-ink-50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-ink-400">Description</p>
              <p className="text-sm text-ink-700">{ticket.description}</p>
            </div>
          )}
          {ticket.fragile && <Badge tone="amber" className="mt-2">Fragile</Badge>}
        </div>

        {/* QR + payment */}
        <div className="flex flex-col items-center gap-3 sm:w-44">
          <div className="rounded-xl border border-ink-100 p-3 text-center">
            {qrUrl ? (
              <img src={qrUrl} alt="QR" width={140} height={140} className="mx-auto rounded-md" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <QRImage value={trackingUrl(ticket.id)} size={140} className="rounded-md" />
            )}
            <p className="mt-2 text-[10px] text-ink-400">Scan to track</p>
          </div>
          <div className="w-full rounded-xl border border-ink-100 bg-ink-50 p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-ink-400">Fee</p>
            <p className="text-lg font-bold text-ink-900">{formatUGX(ticket.fee)}</p>
            <Badge tone={ticket.paymentStatus === 'Paid' ? 'green' : ticket.paymentStatus === 'Pending' ? 'amber' : 'blue'} className="mt-1.5">
              {ticket.paymentStatus}
            </Badge>
            <p className="mt-1.5 text-[10px] text-ink-400">{ticket.paymentMethod}</p>
          </div>
          <div className="w-full text-center text-[11px] text-ink-400">
            <p>Attendant</p>
            <p className="font-medium text-ink-700">{ticket.attendant}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-ink-100 px-5 py-3 text-center text-[11px] text-ink-400">
        Created {formatDateTime(ticket.createdAt)} · Scan QR or visit ParcelFlow to track this parcel.
      </div>
    </div>
  )
}

function Detail({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-400">
        {icon} {label}
      </p>
      <p className="truncate text-sm font-semibold text-ink-800">{value}</p>
      {sub && <p className="truncate text-xs text-ink-500">{sub}</p>}
    </div>
  )
}
