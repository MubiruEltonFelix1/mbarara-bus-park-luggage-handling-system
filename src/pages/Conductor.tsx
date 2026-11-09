import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  User,
  Phone,
  MapPin,
  Wallet,
  CheckCircle2,
  ArrowRight,
  Printer,
  QrCode,
  History,
  Menu,
  X,
} from 'lucide-react'
import { useApp } from '../store/AppStore'
import { usePrint } from '../store/PrintProvider'
import { useToast } from '../components/ui/Toast'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, Input, Select } from '../components/ui/Field'
import { Badge } from '../components/ui/Badge'
import { QRImage } from '../components/ui/QRImage'
import { Modal } from '../components/ui/Modal'
import { ITEM_TYPES, PAYMENT_METHODS, type ItemType, type PaymentMethod, type Ticket } from '../types'
import { copyToClipboard, formatDateTime, formatUGX, isValidUgandanPhone } from '../lib/utils'
import { trackingUrl } from '../lib/qr'

export function Conductor() {
  const { settings, createTicket, tickets } = useApp()
  const { printCopies } = usePrint()
  const toast = useToast()
  const navigate = useNavigate()

  // Form state - simplified for speed
  const [itemType, setItemType] = useState<ItemType>('Parcel')
  const [itemCount, setItemCount] = useState(1)
  const [description, setDescription] = useState('')
  const [weightKg, setWeightKg] = useState(1)
  const [senderName, setSenderName] = useState('')
  const [senderPhone, setSenderPhone] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [destination, setDestination] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [fee, setFee] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<Ticket | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const recent = [...tickets].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!description.trim()) e.description = 'Required'
    if (!senderName.trim()) e.senderName = 'Required'
    if (!senderPhone.trim()) e.senderPhone = 'Required'
    else if (!isValidUgandanPhone(senderPhone)) e.senderPhone = 'Invalid number'
    if (!receiverName.trim()) e.receiverName = 'Required'
    if (!receiverPhone.trim()) e.receiverPhone = 'Required'
    else if (!isValidUgandanPhone(receiverPhone)) e.receiverPhone = 'Invalid number'
    if (!destination.trim()) e.destination = 'Required'
    if (!vehiclePlate.trim()) e.vehiclePlate = 'Required'
    if (fee < 0) e.fee = 'Invalid'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fill all required fields')
      return
    }

    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))

    const ticket = createTicket({
      parkName: settings.parkName,
      itemType,
      itemCount,
      description: description.trim(),
      weightKg,
      fragile: false,
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      destination: destination.trim(),
      originPark: settings.defaultOrigin,
      vehiclePlate: vehiclePlate.trim().toUpperCase(),
      fee,
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash' ? 'Paid' : 'Pending',
      printedCopies: 2,
      attendant: settings.attendants[0]?.name ?? 'Conductor',
      printWidth: settings.defaultPrintWidth,
    })

    setSubmitting(false)
    setSuccess(ticket)
    toast.success('Ticket created', ticket.id)
  }

  const handlePrint = () => {
    if (success) printCopies(success)
  }

  const reset = () => {
    setSuccess(null)
    setDescription('')
    setWeightKg(1)
    setSenderName('')
    setSenderPhone('')
    setReceiverName('')
    setReceiverPhone('')
    setDestination('')
    setVehiclePlate('')
    setFee(0)
    setPaymentMethod('Cash')
    setErrors({})
  }

  const shareLink = async () => {
    if (success) {
      await copyToClipboard(trackingUrl(success.id))
      toast.success('Tracking link copied', 'Share with customer via WhatsApp or SMS')
    }
  }

  if (success) {
    return (
      <SuccessView
        ticket={success}
        onPrint={handlePrint}
        onShare={shareLink}
        onNext={reset}
        onViewAdmin={() => navigate('/dashboard')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-ink-50 pb-6">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Package className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-ink-900">ParcelFlow</p>
              <p className="text-[10px] text-ink-400">Conductor</p>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-ink-900">New Ticket</h1>
            <p className="text-sm text-ink-500">Issue a parcel receipt for the customer</p>
          </div>
          <Button variant="ghost" size="sm" leftIcon={<History className="h-4 w-4" />} onClick={() => setHistoryOpen(true)}>
            Recent
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Parcel Info */}
          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
              <Package className="h-4 w-4 text-brand-600" /> Parcel Details
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type" htmlFor="itemType" required error={errors.itemType}>
                  <Select id="itemType" value={itemType} onChange={(e) => setItemType(e.target.value as ItemType)} className="h-11">
                    {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </Field>
                <Field label="Items" htmlFor="itemCount" required>
                  <Input id="itemCount" type="number" min={1} value={itemCount} onChange={(e) => setItemCount(Math.max(1, parseInt(e.target.value) || 1))} className="h-11" />
                </Field>
              </div>
              <Field label="Description" htmlFor="description" required error={errors.description}>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Blue suitcase" className="h-11" invalid={!!errors.description} />
              </Field>
              <Field label="Weight (kg)" htmlFor="weightKg" required>
                <Input id="weightKg" type="number" min={0.1} step={0.1} value={weightKg} onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)} className="h-11" />
              </Field>
            </div>
          </Card>

          {/* Sender */}
          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
              <User className="h-4 w-4 text-brand-600" /> Sender
            </h2>
            <div className="space-y-3">
              <Field label="Full name" htmlFor="senderName" required error={errors.senderName}>
                <Input id="senderName" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="e.g. John Mukasa" className="h-11" invalid={!!errors.senderName} />
              </Field>
              <Field label="Phone number" htmlFor="senderPhone" required error={errors.senderPhone}>
                <Input id="senderPhone" type="tel" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="0772 112 233" className="h-11" invalid={!!errors.senderPhone} />
              </Field>
            </div>
          </Card>

          {/* Receiver */}
          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
              <User className="h-4 w-4 text-amber-500" /> Receiver
            </h2>
            <div className="space-y-3">
              <Field label="Full name" htmlFor="receiverName" required error={errors.receiverName}>
                <Input id="receiverName" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="e.g. Grace Nakato" className="h-11" invalid={!!errors.receiverName} />
              </Field>
              <Field label="Phone number" htmlFor="receiverPhone" required error={errors.receiverPhone}>
                <Input id="receiverPhone" type="tel" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="0701 445 566" className="h-11" invalid={!!errors.receiverPhone} />
              </Field>
            </div>
          </Card>

          {/* Journey */}
          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
              <MapPin className="h-4 w-4 text-brand-600" /> Journey
            </h2>
            <div className="space-y-3">
              <Field label="Destination" htmlFor="destination" required error={errors.destination}>
                <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Kampala" className="h-11" invalid={!!errors.destination} list="destinations" />
                <datalist id="destinations">
                  {settings.destinations.map((d) => <option key={d} value={d} />)}
                </datalist>
              </Field>
              <Field label="Vehicle plate" htmlFor="vehiclePlate" required error={errors.vehiclePlate}>
                <Input id="vehiclePlate" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} placeholder="UBA 123X" className="h-11" invalid={!!errors.vehiclePlate} />
              </Field>
            </div>
          </Card>

          {/* Payment */}
          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-800">
              <Wallet className="h-4 w-4 text-brand-600" /> Payment
            </h2>
            <div className="space-y-3">
              <Field label="Fee (UGX)" htmlFor="fee" required error={errors.fee}>
                <Input id="fee" type="number" min={0} value={fee} onChange={(e) => setFee(Math.max(0, parseInt(e.target.value) || 0))} placeholder="25000" className="h-11" invalid={!!errors.fee} />
              </Field>
              <Field label="Payment method" htmlFor="paymentMethod" required>
                <Select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="h-11">
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
              </Field>
              {fee > 0 && (
                <div className="rounded-lg bg-brand-50 p-3 text-center">
                  <p className="text-xs text-brand-600">Total amount</p>
                  <p className="text-xl font-bold text-brand-900">{formatUGX(fee)}</p>
                </div>
              )}
            </div>
          </Card>

          <Button type="submit" className="h-12 w-full text-base" loading={submitting} leftIcon={<CheckCircle2 className="h-5 w-5" />}>
            {submitting ? 'Creating ticket...' : 'Create Ticket'}
          </Button>
        </form>
      </div>

      {/* Menu */}
      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" size="sm">
        <div className="space-y-2">
          <button onClick={() => { navigate('/dashboard'); setMenuOpen(false) }} className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-ink-50">
            <Package className="h-5 w-5 text-brand-600" />
            <div>
              <p className="text-sm font-medium text-ink-900">Admin Dashboard</p>
              <p className="text-xs text-ink-500">View reports and manage settings</p>
            </div>
          </button>
          <button onClick={() => { setHistoryOpen(true); setMenuOpen(false) }} className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-ink-50">
            <History className="h-5 w-5 text-ink-500" />
            <div>
              <p className="text-sm font-medium text-ink-900">Recent Tickets</p>
              <p className="text-xs text-ink-500">View recently created tickets</p>
            </div>
          </button>
        </div>
      </Modal>

      {/* History */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Recent Tickets" size="md">
        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-500">No tickets yet</p>
        ) : (
          <div className="space-y-2">
            {recent.map((t) => (
              <button key={t.id} onClick={() => { navigate(`/tickets/${t.id}`); setHistoryOpen(false) }} className="flex w-full items-start gap-3 rounded-lg border border-ink-100 p-3 text-left hover:bg-ink-50">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                  {t.itemType.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-bold text-ink-900">{t.id}</p>
                  <p className="truncate text-sm text-ink-700">{t.senderName} → {t.receiverName}</p>
                  <p className="text-xs text-ink-400">{t.destination} · {formatUGX(t.fee)}</p>
                </div>
                <Badge tone="brand">{t.status}</Badge>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

function SuccessView({
  ticket,
  onPrint,
  onShare,
  onNext,
  onViewAdmin,
}: {
  ticket: Ticket
  onPrint: () => void
  onShare: () => void
  onNext: () => void
  onViewAdmin: () => void
}) {
  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white animate-scale-in">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="text-xl font-bold text-ink-900">Ticket Created</h1>
          <p className="mt-1 font-mono text-lg font-bold text-brand-700">{ticket.id}</p>
          <p className="mt-1 text-sm text-ink-500">Receipt ready for customer</p>
        </div>

        {/* Quick QR display */}
        <Card className="mb-4 p-5">
          <div className="text-center">
            <QRImage value={trackingUrl(ticket.id)} size={200} className="mx-auto rounded-xl" />
            <p className="mt-3 text-xs text-ink-500">Customer can scan this QR code to track their parcel</p>
          </div>
        </Card>

        {/* Ticket summary */}
        <Card className="mb-4 p-4">
          <div className="space-y-2 text-sm">
            <Row label="From" value={ticket.senderName} />
            <Row label="Phone" value={ticket.senderPhone} />
            <div className="border-t border-ink-100 pt-2" />
            <Row label="To" value={ticket.receiverName} />
            <Row label="Phone" value={ticket.receiverPhone} />
            <div className="border-t border-ink-100 pt-2" />
            <Row label="Destination" value={ticket.destination} />
            <Row label="Vehicle" value={ticket.vehiclePlate} />
            <Row label="Parcel" value={`${ticket.itemType} ×${ticket.itemCount} · ${ticket.weightKg}kg`} />
            <div className="border-t border-ink-100 pt-2" />
            <div className="flex justify-between">
              <span className="font-semibold text-ink-700">Total Fee</span>
              <span className="text-lg font-bold text-brand-700">{formatUGX(ticket.fee)}</span>
            </div>
            <p className="text-xs text-ink-400">Payment: {ticket.paymentMethod} · {ticket.paymentStatus}</p>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button onClick={onPrint} className="h-12 w-full text-base" leftIcon={<Printer className="h-5 w-5" />}>
            Print Receipt
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={onShare} leftIcon={<QrCode className="h-4 w-4" />}>
              Share Link
            </Button>
            <Button variant="outline" onClick={onViewAdmin} leftIcon={<Package className="h-4 w-4" />}>
              View Admin
            </Button>
          </div>
          <Button onClick={onNext} variant="ghost" className="w-full" leftIcon={<ArrowRight className="h-4 w-4" />}>
            Create Another Ticket
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          Created {formatDateTime(ticket.createdAt)}
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  )
}
