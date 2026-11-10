// Domain types for ParcelFlow

export type ItemType = 'Parcel' | 'Luggage' | 'Sack/Bag' | 'Box'
export const ITEM_TYPES: ItemType[] = ['Parcel', 'Luggage', 'Sack/Bag', 'Box']

export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Card' | 'Other'
export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Mobile Money', 'Card', 'Other']

export type PaymentStatus = 'Paid' | 'Pending' | 'Partially paid'
export const PAYMENT_STATUSES: PaymentStatus[] = ['Paid', 'Pending', 'Partially paid']

export type TicketStatus =
  | 'Received'
  | 'Awaiting dispatch'
  | 'In transit'
  | 'Arrived at destination'
  | 'Ready for collection'
  | 'Collected'
  | 'Delayed'
  | 'Cancelled'

export const TICKET_STATUSES: TicketStatus[] = [
  'Received',
  'Awaiting dispatch',
  'In transit',
  'Arrived at destination',
  'Ready for collection',
  'Collected',
  'Delayed',
  'Cancelled',
]

/** Ordered flow of "happy path" statuses, used for the timeline visual. */
export const STATUS_FLOW: TicketStatus[] = [
  'Received',
  'Awaiting dispatch',
  'In transit',
  'Arrived at destination',
  'Ready for collection',
  'Collected',
]

export interface StatusUpdate {
  status: TicketStatus
  timestamp: string // ISO
  staff: string
  note?: string
  vehicleOrRoute?: string
}

export interface Attendant {
  id: string
  name: string
  phone: string
  role: string
  active: boolean
}

export interface Ticket {
  id: string // e.g. MBR-2026-000184
  parkName: string
  itemType: ItemType
  itemCount: number
  description: string
  weightKg: number
  itemValue?: number // UGX
  fragile: boolean
  handlingNotes?: string
  // Sender
  senderName: string
  senderPhone: string
  senderId?: string
  // Receiver
  receiverName: string
  receiverPhone: string
  receiverAltPhone?: string
  // Journey
  destination: string
  originPark: string
  vehiclePlate: string
  driverOrCompany?: string
  expectedDeparture?: string // ISO
  expectedArrival?: string // ISO date
  routeNotes?: string
  // Payment
  fee: number // UGX
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  printedCopies: number
  attendant: string
  printWidth: 48 | 80
  // State
  status: TicketStatus
  createdAt: string // ISO
  updatedAt: string // ISO
  statusHistory: StatusUpdate[]
}

export interface ParkSettings {
  parkName: string
  parkAddress: string
  parkPhone: string
  logoDataUrl?: string
  defaultOrigin: string
  defaultPrintWidth: 48 | 80
  ticketPrefix: string
  ticketPad: number // zero-padding length for sequence
  currency: string
  destinations: string[]
  attendants: Attendant[]
  notifications: {
    newTicket: boolean
    statusChange: boolean
    delayedParcel: boolean
  }
}

export type DateFilterKey = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'
