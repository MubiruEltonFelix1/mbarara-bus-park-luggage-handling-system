import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Download,
  Share2,
  Copy,
  Truck,
  PackageCheck,
  Clock,
  XCircle,
  CheckCircle2,
  Plus,
  History,
  Phone,
  User,
  MapPin,
  Wallet,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { usePrint } from '../store/PrintProvider'
import { useToast } from '../components/ui/Toast'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatusBadge, Badge } from '../components/ui/Badge'
import { Field, Select, Textarea, Input } from '../components/ui/Field'
import { Modal, ConfirmDialog } from '../components/ui/Modal'
import { EmptyState } from '../components/ui/EmptyState'
import { DigitalTicket } from '../components/tickets/DigitalTicket'
import { TICKET_STATUSES, type Ticket, type TicketStatus } from '../types'
import { copyToClipboard, formatDateTime, formatUGX, maskName, maskPhone, relativeTime } from '../lib/utils'
import { trackingUrl } from '../lib/qr'
import { STATUS_FLOW } from '../types'

export function TicketDetail() {
  const { id } = useParams()
  const { getTicket, addStatusUpdate, settings } = useApp()
  const { printTicket, printDigital } = usePrint()
  const toast = useToast()
  const navigate = useNavigate()

  const ticket = useMemo(() => (id ? getTicket(id) : undefined), [id, getTicket])
  const [updateOpen, setUpdateOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<TicketStatus>('Awaiting dispatch')
  const [note, setNote] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [staff, setStaff] = useState(settings.attendants[0]?.name ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!ticket) {
    return (
      <div className="space-y-5">
        <PageHeader title="Ticket not found" />
        <Card>
          <EmptyState
            icon={<PackageCheck className="h-6 w-6" />}
            title="We couldn't find this ticket"
            description="The ticket ID may be incorrect or the ticket was removed."
            action={<Button onClick={() => navigate('/tickets')}>Back to all tickets</Button>}
          />
        </Card>
      </div>
    )
  }

  const shareLink = async () => {
    await copyToClipboard(trackingUrl(ticket.id))
    toast.success('Tracking link copied', trackingUrl(ticket.id))
  }
  const copyId = async () => {
    await copyToClipboard(ticket.id)
    toast.success('Ticket ID copied', ticket.id)
  }

  const submitStatus = () => {
    addStatusUpdate(ticket.id, {
      status: newStatus,
      staff,
      note: note.trim() || undefined,
      vehicleOrRoute: vehicle.trim() || undefined,
    })
    toast.success('Status updated', `${ticket.id} is now ${newStatus}.`)
    setUpdateOpen(false)
    setConfirmOpen(false)
    setNote('')
    setVehicle('')
  }

  const openUpdate = (status: TicketStatus) => {
    setNewStatus(status)
    setStaff(settings.attendants[0]?.name ?? '')
    if (status === 'Collected' || status === 'Cancelled') setConfirmOpen(true)
    else setUpdateOpen(true)
  }

  const needsConfirm = newStatus === 'Collected' || newStatus === 'Cancelled'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/tickets')}>
          All tickets
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Printer className="h-4 w-4" />} onClick={() => printTicket(ticket)}>Print</Button>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => printDigital(ticket)}>PDF</Button>
          <Button variant="outline" size="sm" leftIcon={<Share2 className="h-4 w-4" />} onClick={shareLink}>Share</Button>
          <Button variant="outline" size="sm" leftIcon={<Copy className="h-4 w-4" />} onClick={copyId}>Copy ID</Button>
        </div>
      </div>

      <PageHeader
        title={ticket.id}
        subtitle={`Created ${formatDateTime(ticket.createdAt)} · ${ticket.parkName}`}
        actions={<StatusBadge status={ticket.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Ticket preview */}
        <div className="lg:col-span-3">
          <DigitalTicket ticket={ticket} copyLabel="Customer copy" />

          {/* Quick status update buttons */}
          <Card className="mt-5">
            <CardHeader>
              <CardTitle>Update status</CardTitle>
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => openUpdate('Awaiting dispatch')}>Custom update</Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['Awaiting dispatch', 'In transit', 'Arrived at destination', 'Ready for collection', 'Collected', 'Delayed', 'Cancelled'] as TicketStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => openUpdate(s)}
                    disabled={s === ticket.status}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-ink-200 p-3 text-center text-xs font-medium text-ink-700 transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-40"
                  >
                    <StatusIcon status={s} />
                    {s}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: details + timeline */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Parcel & people</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Detail icon={<PackageCheck className="h-4 w-4 text-brand-600" />} label="Parcel" value={`${ticket.itemType} ×${ticket.itemCount} · ${ticket.weightKg} kg`} />
              <Detail icon={<PackageCheck className="h-4 w-4 text-ink-400" />} label="Description" value={ticket.description} />
              {ticket.itemValue ? <Detail icon={<Wallet className="h-4 w-4 text-ink-400" />} label="Declared value" value={formatUGX(ticket.itemValue)} /> : null}
              {ticket.fragile && <Badge tone="amber">Fragile</Badge>}
              {ticket.handlingNotes && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">{ticket.handlingNotes}</p>}
              <div className="border-t border-ink-100 pt-3">
                <Detail icon={<User className="h-4 w-4 text-brand-600" />} label="Sender" value={`${ticket.senderName} · ${ticket.senderPhone}`} />
                <Detail icon={<Phone className="h-4 w-4 text-ink-400" />} label="Receiver" value={`${ticket.receiverName} · ${ticket.receiverPhone}`} />
                {ticket.receiverAltPhone && <Detail icon={<Phone className="h-4 w-4 text-ink-400" />} label="Alt phone" value={ticket.receiverAltPhone} />}
              </div>
              <div className="border-t border-ink-100 pt-3">
                <Detail icon={<MapPin className="h-4 w-4 text-brand-600" />} label="Route" value={`${ticket.originPark} → ${ticket.destination}`} />
                <Detail icon={<Truck className="h-4 w-4 text-ink-400" />} label="Vehicle" value={ticket.vehiclePlate} />
                {ticket.driverOrCompany && <Detail icon={<Truck className="h-4 w-4 text-ink-400" />} label="Company" value={ticket.driverOrCompany} />}
                {ticket.routeNotes && <p className="text-xs text-ink-500">{ticket.routeNotes}</p>}
              </div>
              <div className="border-t border-ink-100 pt-3">
                <Detail icon={<Wallet className="h-4 w-4 text-brand-600" />} label="Fee" value={formatUGX(ticket.fee)} />
                <Detail icon={<Wallet className="h-4 w-4 text-ink-400" />} label="Payment" value={`${ticket.paymentMethod} · ${ticket.paymentStatus}`} />
                <Detail icon={<User className="h-4 w-4 text-ink-400" />} label="Attendant" value={ticket.attendant} />
              </div>
            </CardContent>
          </Card>

          {/* Status timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="h-4 w-4 text-ink-400" /> Status timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <ol className="relative space-y-5 border-l border-ink-200 pl-5">
                {[...ticket.statusHistory].reverse().map((h, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white ${h.status === 'Cancelled' ? 'bg-red-500' : h.status === 'Delayed' ? 'bg-amber-500' : 'bg-brand-500'}`} />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink-800">{h.status}</p>
                      <span className="text-[11px] text-ink-400">{relativeTime(h.timestamp)}</span>
                    </div>
                    <p className="text-xs text-ink-500">{formatDateTime(h.timestamp)} · {h.staff}</p>
                    {h.note && <p className="mt-1 text-xs text-ink-600">{h.note}</p>}
                    {h.vehicleOrRoute && <p className="mt-0.5 text-xs text-ink-400">Vehicle: {h.vehicleOrRoute}</p>}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status update modal */}
      <Modal
        open={updateOpen}
        onClose={() => setUpdateOpen(false)}
        title="Update parcel status"
        description={`Ticket ${ticket.id}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setUpdateOpen(false)}>Cancel</Button>
            <Button onClick={submitStatus}>Save update</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="New status" htmlFor="newStatus" required>
            <Select id="newStatus" value={newStatus} onChange={(e) => setNewStatus(e.target.value as TicketStatus)}>
              {TICKET_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Staff member" htmlFor="staff" required>
            <Select id="staff" value={staff} onChange={(e) => setStaff(e.target.value)}>
              {settings.attendants.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="Vehicle or route (optional)" htmlFor="vehicle">
            <Input id="vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g. UBA 123X · Mbarara → Kampala" />
          </Field>
          <Field label="Note (optional)" htmlFor="note">
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note about this status change" />
          </Field>
        </div>
      </Modal>

      {/* Confirm for collected / cancelled */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submitStatus}
        title={newStatus === 'Collected' ? 'Confirm collection' : 'Confirm cancellation'}
        message={
          newStatus === 'Collected'
            ? `Mark ticket ${ticket.id} as collected? Make sure the receiver (${ticket.receiverName}) has collected the parcel.`
            : `Cancel ticket ${ticket.id}? This will stop further tracking updates.`
        }
        confirmLabel={newStatus === 'Collected' ? 'Mark as collected' : 'Cancel ticket'}
        variant={newStatus === 'Cancelled' ? 'danger' : 'primary'}
      />
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-400">{icon} {label}</p>
      <p className="mt-0.5 text-sm text-ink-800">{value}</p>
    </div>
  )
}

function StatusIcon({ status }: { status: TicketStatus }) {
  const cls = 'h-5 w-5'
  switch (status) {
    case 'Collected':
      return <CheckCircle2 className={`${cls} text-emerald-500`} />
    case 'Cancelled':
      return <XCircle className={`${cls} text-red-500`} />
    case 'Delayed':
      return <Clock className={`${cls} text-amber-500`} />
    case 'In transit':
      return <Truck className={`${cls} text-blue-500`} />
    default:
      return <PackageCheck className={`${cls} text-ink-400`} />
  }
}
