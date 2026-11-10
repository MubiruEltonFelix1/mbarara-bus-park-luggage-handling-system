import type {
  ItemType,
  ParkSettings,
  PaymentMethod,
  PaymentStatus,
  Ticket,
} from '../types'
import { ITEM_TYPES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../types'
import { isValidUgandanPhone } from './utils'

export interface TicketFormData {
  parkName: string
  itemType: ItemType
  itemCount: number
  description: string
  weightKg: number
  itemValue?: number
  fragile: boolean
  handlingNotes?: string
  senderName: string
  senderPhone: string
  senderId?: string
  receiverName: string
  receiverPhone: string
  receiverAltPhone?: string
  destination: string
  originPark: string
  vehiclePlate: string
  driverOrCompany?: string
  expectedDeparture?: string
  expectedArrival?: string
  routeNotes?: string
  fee: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  printedCopies: number
  attendant: string
  printWidth: 48 | 80
}

export const STEPS = ['Parcel details', 'Sender & receiver', 'Journey', 'Payment & ticket'] as const
export type StepIndex = 0 | 1 | 2 | 3

export function createEmptyForm(settings: ParkSettings): TicketFormData {
  return {
    parkName: settings.parkName,
    itemType: 'Parcel',
    itemCount: 1,
    description: '',
    weightKg: 1,
    itemValue: undefined,
    fragile: false,
    handlingNotes: '',
    senderName: '',
    senderPhone: '',
    senderId: '',
    receiverName: '',
    receiverPhone: '',
    receiverAltPhone: '',
    destination: '',
    originPark: settings.defaultOrigin,
    vehiclePlate: '',
    driverOrCompany: '',
    expectedDeparture: '',
    expectedArrival: '',
    routeNotes: '',
    fee: 0,
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    printedCopies: 2,
    attendant: settings.attendants[0]?.name ?? '',
    printWidth: settings.defaultPrintWidth,
  }
}

export type FormErrors = Partial<Record<keyof TicketFormData, string>>

function num(v: string): number {
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

export function validateStep(form: TicketFormData, step: StepIndex): FormErrors {
  const e: FormErrors = {}
  if (step === 0) {
    if (!form.description.trim()) e.description = 'Item description is required.'
    if (!ITEM_TYPES.includes(form.itemType)) e.itemType = 'Select a valid item type.'
    if (!(form.itemCount >= 1)) e.itemCount = 'Must be at least 1 item.'
    if (!(form.weightKg > 0)) e.weightKg = 'Weight must be greater than 0 kg.'
    if (form.itemValue !== undefined && form.itemValue < 0) e.itemValue = 'Item value cannot be negative.'
  }
  if (step === 1) {
    if (!form.senderName.trim()) e.senderName = 'Sender name is required.'
    if (!form.senderPhone.trim()) e.senderPhone = 'Sender phone is required.'
    else if (!isValidUgandanPhone(form.senderPhone)) e.senderPhone = 'Enter a valid Ugandan number, e.g. 0772 112 233 or +256…'
    if (!form.receiverName.trim()) e.receiverName = 'Receiver name is required.'
    if (!form.receiverPhone.trim()) e.receiverPhone = 'Receiver phone is required.'
    else if (!isValidUgandanPhone(form.receiverPhone)) e.receiverPhone = 'Enter a valid Ugandan number, e.g. 0701 445 566 or +256…'
    if (form.receiverAltPhone && form.receiverAltPhone.trim() && !isValidUgandanPhone(form.receiverAltPhone))
      e.receiverAltPhone = 'Enter a valid Ugandan number.'
  }
  if (step === 2) {
    if (!form.destination.trim()) e.destination = 'Destination is required.'
    if (!form.originPark.trim()) e.originPark = 'Origin park is required.'
    if (!form.vehiclePlate.trim()) e.vehiclePlate = 'Vehicle plate is required.'
    else if (form.vehiclePlate.trim().length < 3) e.vehiclePlate = 'Plate looks too short.'
    if (form.expectedArrival && form.expectedDeparture && new Date(form.expectedArrival) < new Date(form.expectedDeparture))
      e.expectedArrival = 'Arrival should be after departure.'
  }
  if (step === 3) {
    if (!(form.fee >= 0)) e.fee = 'Fee must be 0 or more.'
    if (!PAYMENT_METHODS.includes(form.paymentMethod)) e.paymentMethod = 'Select a payment method.'
    if (!PAYMENT_STATUSES.includes(form.paymentStatus)) e.paymentStatus = 'Select a payment status.'
    if (!(form.printedCopies >= 1 && form.printedCopies <= 5)) e.printedCopies = 'Copies must be between 1 and 5.'
    if (!form.attendant.trim()) e.attendant = 'Attendant name is required.'
    if (form.printWidth !== 48 && form.printWidth !== 80) e.printWidth = 'Select 48mm or 80mm.'
  }
  return e
}

export function validateAll(form: TicketFormData): { errors: FormErrors; firstInvalidStep: StepIndex | null } {
  let merged: FormErrors = {}
  let firstInvalid: StepIndex | null = null
  for (let s = 0; s < 4; s++) {
    const e = validateStep(form, s as StepIndex)
    if (Object.keys(e).length > 0 && firstInvalid === null) firstInvalid = s as StepIndex
    merged = { ...merged, ...e }
  }
  return { errors: merged, firstInvalidStep: firstInvalid }
}

/** Completion ratio 0-1 across required fields. */
export function formCompletion(form: TicketFormData): number {
  const checks = [
    !!form.description.trim(),
    form.itemCount >= 1,
    form.weightKg > 0,
    !!form.senderName.trim(),
    isValidUgandanPhone(form.senderPhone),
    !!form.receiverName.trim(),
    isValidUgandanPhone(form.receiverPhone),
    !!form.destination.trim(),
    !!form.originPark.trim(),
    !!form.vehiclePlate.trim() && form.vehiclePlate.trim().length >= 3,
    form.fee >= 0,
    !!form.attendant.trim(),
  ]
  const done = checks.filter(Boolean).length
  return done / checks.length
}

export function formToTicketInput(form: TicketFormData) {
  return {
    parkName: form.parkName,
    itemType: form.itemType,
    itemCount: form.itemCount,
    description: form.description.trim(),
    weightKg: form.weightKg,
    itemValue: form.itemValue || undefined,
    fragile: form.fragile,
    handlingNotes: form.handlingNotes?.trim() || undefined,
    senderName: form.senderName.trim(),
    senderPhone: form.senderPhone.trim(),
    senderId: form.senderId?.trim() || undefined,
    receiverName: form.receiverName.trim(),
    receiverPhone: form.receiverPhone.trim(),
    receiverAltPhone: form.receiverAltPhone?.trim() || undefined,
    destination: form.destination.trim(),
    originPark: form.originPark.trim(),
    vehiclePlate: form.vehiclePlate.trim().toUpperCase(),
    driverOrCompany: form.driverOrCompany?.trim() || undefined,
    expectedDeparture: form.expectedDeparture || undefined,
    expectedArrival: form.expectedArrival || undefined,
    routeNotes: form.routeNotes?.trim() || undefined,
    fee: form.fee,
    paymentMethod: form.paymentMethod,
    paymentStatus: form.paymentStatus,
    printedCopies: form.printedCopies,
    attendant: form.attendant.trim(),
    printWidth: form.printWidth,
  }
}

export function ticketToForm(ticket: Ticket): TicketFormData {
  return {
    parkName: ticket.parkName,
    itemType: ticket.itemType,
    itemCount: ticket.itemCount,
    description: ticket.description,
    weightKg: ticket.weightKg,
    itemValue: ticket.itemValue,
    fragile: ticket.fragile,
    handlingNotes: ticket.handlingNotes,
    senderName: ticket.senderName,
    senderPhone: ticket.senderPhone,
    senderId: ticket.senderId,
    receiverName: ticket.receiverName,
    receiverPhone: ticket.receiverPhone,
    receiverAltPhone: ticket.receiverAltPhone,
    destination: ticket.destination,
    originPark: ticket.originPark,
    vehiclePlate: ticket.vehiclePlate,
    driverOrCompany: ticket.driverOrCompany,
    expectedDeparture: ticket.expectedDeparture,
    expectedArrival: ticket.expectedArrival,
    routeNotes: ticket.routeNotes,
    fee: ticket.fee,
    paymentMethod: ticket.paymentMethod,
    paymentStatus: ticket.paymentStatus,
    printedCopies: ticket.printedCopies,
    attendant: ticket.attendant,
    printWidth: ticket.printWidth,
  }
}

// helpers used in numeric inputs
export const toNum = num
