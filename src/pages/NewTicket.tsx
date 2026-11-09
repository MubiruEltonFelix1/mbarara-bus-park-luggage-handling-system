import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Package,
  PackagePlus,
  Plus,
  Printer,
  QrCode,
  Share2,
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
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { Toggle } from '../components/ui/Toggle'
import { Progress } from '../components/ui/Progress'
import { Combobox } from '../components/ui/Combobox'
import { Badge } from '../components/ui/Badge'
import { DigitalTicket } from '../components/tickets/DigitalTicket'
import {
  STEPS,
  createEmptyForm,
  formCompletion,
  formToTicketInput,
  validateAll,
  validateStep,
  type FormErrors,
  type StepIndex,
  type TicketFormData,
  toNum,
} from '../lib/ticketForm'
import { ITEM_TYPES, PAYMENT_METHODS, PAYMENT_STATUSES, type Ticket } from '../types'
import { copyToClipboard, formatUGX, nowIso } from '../lib/utils'
import { trackingUrl } from '../lib/qr'

export function NewTicket() {
  const { settings, createTicket } = useApp()
  const { printCopies, printDigital } = usePrint()
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState<TicketFormData>(() => createEmptyForm(settings))
  const [step, setStep] = useState<StepIndex>(0)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<Ticket | null>(null)

  const completion = useMemo(() => formCompletion(form), [form])

  const set = <K extends keyof TicketFormData>(key: K, value: TicketFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (touched) setErrors(validateStep({ ...form, [key]: value }, step))
  }

  const goNext = () => {
    const e = validateStep(form, step)
    setErrors(e)
    setTouched(true)
    if (Object.keys(e).length === 0) {
      setStep((s) => Math.min(3, s + 1) as StepIndex)
      setTouched(false)
      setErrors({})
    }
  }
  const goBack = () => {
    setStep((s) => Math.max(0, s - 1) as StepIndex)
    setTouched(false)
    setErrors({})
  }

  const generate = async () => {
    const { errors: all, firstInvalidStep } = validateAll(form)
    if (firstInvalidStep !== null || Object.keys(all).length > 0) {
      if (firstInvalidStep !== null) setStep(firstInvalidStep)
      setErrors(all)
      setTouched(true)
      toast.error('Please fix the highlighted fields', 'Some required information is missing or invalid.')
      return
    }
    setSubmitting(true)
    // small delay to show loading state
    await new Promise((r) => setTimeout(r, 500))
    const ticket = createTicket(formToTicketInput(form))
    setSubmitting(false)
    setCreated(ticket)
    toast.success(`Ticket ${ticket.id} created successfully`, 'Status set to Received. Saved to ticket history.')
  }

  /* ---------------- Success view ---------------- */
  if (created) {
    return <SuccessView ticket={created} onAnother={() => { setCreated(null); setForm(createEmptyForm(settings)); setStep(0) }} />
  }

  const previewTicket: Ticket = {
    ...formToTicketInput(form),
    id: form.parkName.split(' ')[0].slice(0, 3).toUpperCase() + '-2026-######',
    status: 'Received',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    statusHistory: [],
  } as Ticket

  return (
    <div className="space-y-5">
      <PageHeader title="New ticket" subtitle="Create a parcel ticket in a few guided steps" />

      {/* Stepper header */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ol className="flex flex-1 items-center gap-1 sm:gap-2">
            {STEPS.map((label, i) => {
              const active = i === step
              const done = i < step
              return (
                <li key={label} className="flex flex-1 items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => {
                      if (i < step) { setStep(i as StepIndex); setTouched(false); setErrors({}) }
                    }}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition sm:text-sm ${active ? 'text-brand-700' : done ? 'text-ink-600 hover:text-brand-700' : 'text-ink-400'}`}
                    disabled={i > step}
                  >
                    <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${active ? 'bg-brand-600 text-white' : done ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'}`}>
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                  {i < STEPS.length - 1 && <span className={`h-px flex-1 ${done ? 'bg-brand-300' : 'bg-ink-200'} hidden sm:block`} />}
                </li>
              )
            })}
          </ol>
          <div className="flex items-center gap-2 sm:w-44">
            <Progress value={completion * 100} />
            <span className="text-xs font-medium text-ink-500">{Math.round(completion * 100)}%</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  {step === 0 && <Package className="h-4 w-4 text-brand-600" />}
                  {step === 1 && <User className="h-4 w-4 text-brand-600" />}
                  {step === 2 && <MapPin className="h-4 w-4 text-brand-600" />}
                  {step === 3 && <Wallet className="h-4 w-4 text-brand-600" />}
                  {STEPS[step]}
                </span>
              </CardTitle>
              <Badge tone="brand">Step {step + 1} of {STEPS.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 0 && <ParcelDetailsStep form={form} errors={errors} set={set} />}
              {step === 1 && <SenderReceiverStep form={form} errors={errors} set={set} />}
              {step === 2 && <JourneyStep form={form} errors={errors} set={set} destinations={settings.destinations} />}
              {step === 3 && <PaymentStep form={form} errors={errors} set={set} attendants={settings.attendants} />}

              {/* Nav buttons */}
              <div className="flex items-center justify-between gap-2 border-t border-ink-100 pt-4">
                <Button variant="ghost" onClick={goBack} disabled={step === 0} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Back
                </Button>
                {step < 3 ? (
                  <Button onClick={goNext} rightIcon={<ArrowRight className="h-4 w-4" />}>Continue</Button>
                ) : (
                  <Button onClick={generate} loading={submitting} leftIcon={<PackagePlus className="h-4 w-4" />}>
                    {submitting ? 'Generating…' : 'Generate ticket'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-20">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Live preview</p>
              <span className="text-xs text-ink-400">Updates as you type</span>
            </div>
            <DigitalTicket ticket={previewTicket} copyLabel="Preview" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Success view                                                        */
/* ------------------------------------------------------------------ */
function SuccessView({ ticket, onAnother }: { ticket: Ticket; onAnother: () => void }) {
  const { printCopies, printDigital } = usePrint()
  const toast = useToast()
  const navigate = useNavigate()

  const copyId = async () => {
    await copyToClipboard(ticket.id)
    toast.success('Ticket ID copied', ticket.id)
  }
  const shareLink = async () => {
    const url = trackingUrl(ticket.id)
    await copyToClipboard(url)
    toast.success('Tracking link copied', 'Paste it into WhatsApp or SMS to share.')
  }
  const shareWhatsapp = () => {
    const url = trackingUrl(ticket.id)
    const text = `Hello ${ticket.receiverName}, your parcel (${ticket.id}) from ${ticket.originPark} to ${ticket.destination} is being tracked via ParcelFlow. Track here: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 animate-scale-in">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-900">Ticket {ticket.id} created successfully</h1>
        <p className="mt-1.5 text-sm text-ink-500">
          Status set to <Badge tone="teal" dot>Received</Badge>. The ticket is saved to history and ready to print.
        </p>
      </div>

      <DigitalTicket ticket={ticket} copyLabel="Customer copy" />

      <Card className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Actions</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button onClick={() => printCopies(ticket)} leftIcon={<Printer className="h-4 w-4" />}>Print ticket</Button>
          <Button variant="outline" onClick={() => printDigital(ticket)} leftIcon={<Download className="h-4 w-4" />}>Download PDF</Button>
          <Button variant="outline" onClick={shareWhatsapp} leftIcon={<Share2 className="h-4 w-4" />}>Share on WhatsApp</Button>
          <Button variant="outline" onClick={shareLink} leftIcon={<QrCode className="h-4 w-4" />}>Copy tracking link</Button>
          <Button variant="outline" onClick={copyId} leftIcon={<Copy className="h-4 w-4" />}>Copy ticket ID</Button>
          <Button variant="ghost" onClick={() => navigate(`/tickets/${ticket.id}`)} leftIcon={<Check className="h-4 w-4" />}>View ticket</Button>
        </div>
        <div className="mt-4 border-t border-ink-100 pt-4">
          <Button onClick={onAnother} leftIcon={<Plus className="h-4 w-4" />} className="w-full sm:w-auto">
            Create another ticket
          </Button>
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Step components                                                      */
/* ------------------------------------------------------------------ */
type StepProps = {
  form: TicketFormData
  errors: FormErrors
  set: <K extends keyof TicketFormData>(key: K, value: TicketFormData[K]) => void
}

function ParcelDetailsStep({ form, errors, set }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ticket type" htmlFor="itemType" required error={errors.itemType}>
          <Select id="itemType" value={form.itemType} onChange={(e) => set('itemType', e.target.value as TicketFormData['itemType'])} invalid={!!errors.itemType}>
            {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Number of items" htmlFor="itemCount" required error={errors.itemCount}>
          <Input id="itemCount" type="number" min={1} value={form.itemCount} onChange={(e) => set('itemCount', Math.max(1, toNum(e.target.value)))} invalid={!!errors.itemCount} />
        </Field>
      </div>
      <Field label="Item description" htmlFor="description" required error={errors.description} hint="e.g. Brown carton with household items">
        <Input id="description" value={form.description} onChange={(e) => set('description', e.target.value)} invalid={!!errors.description} placeholder="Describe the parcel" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Weight (kg)" htmlFor="weightKg" required error={errors.weightKg}>
          <Input id="weightKg" type="number" min={0} step="0.1" value={form.weightKg} onChange={(e) => set('weightKg', toNum(e.target.value))} invalid={!!errors.weightKg} />
        </Field>
        <Field label="Item value (UGX, optional)" htmlFor="itemValue" error={errors.itemValue} hint="Declared value for high-value items">
          <Input id="itemValue" type="number" min={0} value={form.itemValue ?? ''} onChange={(e) => set('itemValue', e.target.value ? toNum(e.target.value) : undefined)} invalid={!!errors.itemValue} placeholder="e.g. 150000" />
        </Field>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-ink-200 bg-ink-50 p-3">
        <Toggle checked={form.fragile} onChange={(v) => set('fragile', v)} label="Fragile" description="Mark the parcel as fragile for careful handling" />
      </div>
      <Field label="Special handling notes (optional)" htmlFor="handlingNotes">
        <Textarea id="handlingNotes" value={form.handlingNotes} onChange={(e) => set('handlingNotes', e.target.value)} placeholder="e.g. Keep upright, do not stack" />
      </Field>
    </div>
  )
}

function SenderReceiverStep({ form, errors, set }: StepProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Sender</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="senderName" required error={errors.senderName}>
            <Input id="senderName" value={form.senderName} onChange={(e) => set('senderName', e.target.value)} invalid={!!errors.senderName} placeholder="e.g. Joel Tumusiime" />
          </Field>
          <Field label="Phone number" htmlFor="senderPhone" required error={errors.senderPhone} hint="0XXXXXXXXX or +256XXXXXXXXX">
            <Input id="senderPhone" type="tel" value={form.senderPhone} onChange={(e) => set('senderPhone', e.target.value)} invalid={!!errors.senderPhone} placeholder="0772 112 233" />
          </Field>
        </div>
        <Field label="National ID or reference (optional)" htmlFor="senderId" className="mt-4">
          <Input id="senderId" value={form.senderId} onChange={(e) => set('senderId', e.target.value)} placeholder="e.g. CM90123456" />
        </Field>
      </div>
      <div className="border-t border-ink-100 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Receiver</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="receiverName" required error={errors.receiverName}>
            <Input id="receiverName" value={form.receiverName} onChange={(e) => set('receiverName', e.target.value)} invalid={!!errors.receiverName} placeholder="e.g. Grace Nakato" />
          </Field>
          <Field label="Phone number" htmlFor="receiverPhone" required error={errors.receiverPhone} hint="0XXXXXXXXX or +256XXXXXXXXX">
            <Input id="receiverPhone" type="tel" value={form.receiverPhone} onChange={(e) => set('receiverPhone', e.target.value)} invalid={!!errors.receiverPhone} placeholder="0701 445 566" />
          </Field>
        </div>
        <Field label="Alternative phone number (optional)" htmlFor="receiverAltPhone" className="mt-4" error={errors.receiverAltPhone}>
          <Input id="receiverAltPhone" type="tel" value={form.receiverAltPhone} onChange={(e) => set('receiverAltPhone', e.target.value)} invalid={!!errors.receiverAltPhone} placeholder="0788 778 899" />
        </Field>
      </div>
    </div>
  )
}

function JourneyStep({ form, errors, set, destinations }: StepProps & { destinations: string[] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Destination" htmlFor="destination" required error={errors.destination} hint="Search or type a destination">
          <Combobox id="destination" value={form.destination} options={destinations} onChange={(v) => set('destination', v)} invalid={!!errors.destination} placeholder="e.g. Kampala" />
        </Field>
        <Field label="Origin park" htmlFor="originPark" required error={errors.originPark}>
          <Input id="originPark" value={form.originPark} onChange={(e) => set('originPark', e.target.value)} invalid={!!errors.originPark} placeholder="e.g. Mbarara Bus Park" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vehicle / bus plate number" htmlFor="vehiclePlate" required error={errors.vehiclePlate} hint="e.g. UBA 123X">
          <Input id="vehiclePlate" value={form.vehiclePlate} onChange={(e) => set('vehiclePlate', e.target.value.toUpperCase())} invalid={!!errors.vehiclePlate} placeholder="UBA 123X" />
        </Field>
        <Field label="Driver or transport company (optional)" htmlFor="driverOrCompany">
          <Input id="driverOrCompany" value={form.driverOrCompany} onChange={(e) => set('driverOrCompany', e.target.value)} placeholder="e.g. Kalita Coaches" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Expected departure" htmlFor="expectedDeparture">
          <Input id="expectedDeparture" type="datetime-local" value={form.expectedDeparture ?? ''} onChange={(e) => set('expectedDeparture', e.target.value)} />
        </Field>
        <Field label="Expected arrival" htmlFor="expectedArrival" error={errors.expectedArrival}>
          <Input id="expectedArrival" type="date" value={form.expectedArrival ?? ''} onChange={(e) => set('expectedArrival', e.target.value)} invalid={!!errors.expectedArrival} />
        </Field>
      </div>
      <Field label="Route notes (optional)" htmlFor="routeNotes">
        <Textarea id="routeNotes" value={form.routeNotes} onChange={(e) => set('routeNotes', e.target.value)} placeholder="e.g. Via Masaka, Lyantonde" />
      </Field>
    </div>
  )
}

function PaymentStep({ form, errors, set, attendants }: StepProps & { attendants: { name: string }[] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fee (UGX)" htmlFor="fee" required error={errors.fee}>
          <Input id="fee" type="number" min={0} value={form.fee} onChange={(e) => set('fee', Math.max(0, toNum(e.target.value)))} invalid={!!errors.fee} placeholder="e.g. 25000" />
        </Field>
        <Field label="Payment method" htmlFor="paymentMethod" required error={errors.paymentMethod}>
          <Select id="paymentMethod" value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value as TicketFormData['paymentMethod'])} invalid={!!errors.paymentMethod}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Payment status" htmlFor="paymentStatus" required error={errors.paymentStatus}>
          <Select id="paymentStatus" value={form.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value as TicketFormData['paymentStatus'])} invalid={!!errors.paymentStatus}>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="Number of printed copies" htmlFor="printedCopies" required error={errors.printedCopies} hint="1–5 copies">
          <Input id="printedCopies" type="number" min={1} max={5} value={form.printedCopies} onChange={(e) => set('printedCopies', Math.min(5, Math.max(1, toNum(e.target.value) || 1)))} invalid={!!errors.printedCopies} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Attendant" htmlFor="attendant" required error={errors.attendant}>
          <Select id="attendant" value={form.attendant} onChange={(e) => set('attendant', e.target.value)} invalid={!!errors.attendant}>
            <option value="">Select attendant…</option>
            {attendants.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
          </Select>
        </Field>
        <Field label="Thermal printer width" htmlFor="printWidth" required error={errors.printWidth}>
          <Select id="printWidth" value={form.printWidth} onChange={(e) => set('printWidth', Number(e.target.value) as 48 | 80)} invalid={!!errors.printWidth}>
            <option value={48}>48 mm</option>
            <option value={80}>80 mm</option>
          </Select>
        </Field>
      </div>

      {/* Live fee summary */}
      <div className="rounded-xl border border-ink-100 bg-ink-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Fee summary</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-ink-500">Parcel fee</span><span className="font-semibold text-ink-900">{formatUGX(form.fee)}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Payment method</span><span className="font-medium text-ink-700">{form.paymentMethod}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Payment status</span><span className="font-medium text-ink-700">{form.paymentStatus}</span></div>
          <div className="mt-2 flex justify-between border-t border-ink-200 pt-2"><span className="font-semibold text-ink-700">Total</span><span className="text-lg font-bold text-brand-700">{formatUGX(form.fee)}</span></div>
        </div>
      </div>
    </div>
  )
}
